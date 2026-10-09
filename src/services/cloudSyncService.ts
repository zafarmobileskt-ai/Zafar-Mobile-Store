import { MobileItem, SaleRecord, Customer, ShopSettings } from '../types/mobile';
import { doc, setDoc, getDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface SyncPayload {
  inventory: MobileItem[];
  sales: SaleRecord[];
  customers: Customer[];
  settings: ShopSettings;
  sourceDevice?: string;
  forceOverwrite?: boolean;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  data?: SyncPayload & { lastSyncTime?: string; lastUpdatedBy?: string };
}

// Device detection helper
export const getClientDeviceType = (): 'phone' | 'system' => {
  if (typeof window === 'undefined') return 'system';
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua);
  return isMobile ? 'phone' : 'system';
};

/**
 * Merges two store datasets smartly without losing items or overwriting newer entries
 */
export function mergeStoreDatasets(local: SyncPayload, cloud: SyncPayload): SyncPayload {
  // 1. Inventory: merge by id
  const invMap = new Map<string, MobileItem>();
  (local.inventory || []).forEach((item) => {
    if (item?.id) invMap.set(item.id, item);
  });
  (cloud.inventory || []).forEach((item) => {
    if (item?.id) {
      const existing = invMap.get(item.id);
      if (!existing) {
        invMap.set(item.id, item);
      } else {
        // Pick newer by updatedAt or keep existing if local is newer
        const localTime = new Date(existing.updatedAt || 0).getTime();
        const cloudTime = new Date(item.updatedAt || 0).getTime();
        invMap.set(item.id, cloudTime >= localTime ? item : existing);
      }
    }
  });

  // 2. Sales: merge by saleId or invoiceNumber
  const salesMap = new Map<string, SaleRecord>();
  (local.sales || []).forEach((s) => {
    const key = s.saleId || s.invoiceNumber;
    if (key) salesMap.set(key, s);
  });
  (cloud.sales || []).forEach((s) => {
    const key = s.saleId || s.invoiceNumber;
    if (key) {
      const existing = salesMap.get(key);
      if (!existing) {
        salesMap.set(key, s);
      } else {
        const localTime = new Date(existing.saleDate || 0).getTime();
        const cloudTime = new Date(s.saleDate || 0).getTime();
        salesMap.set(key, cloudTime >= localTime ? s : existing);
      }
    }
  });

  // 3. Customers: merge by id or normalized phone
  const custMap = new Map<string, Customer>();
  (local.customers || []).forEach((c) => {
    const key = c.id || c.phone?.replace(/\D/g, '');
    if (key) custMap.set(key, c);
  });
  (cloud.customers || []).forEach((cloudCust) => {
    const key = cloudCust.id || cloudCust.phone?.replace(/\D/g, '');
    if (!key) return;

    const localCust = custMap.get(key);
    if (!localCust) {
      custMap.set(key, cloudCust);
    } else {
      // Merge ledger entries
      const ledgerMap = new Map();
      (localCust.ledgerEntries || []).forEach((l) => { if (l?.id) ledgerMap.set(l.id, l); });
      (cloudCust.ledgerEntries || []).forEach((l) => { if (l?.id) ledgerMap.set(l.id, l); });

      // Merge manual purchases
      const manualMap = new Map();
      (localCust.manualPurchases || []).forEach((m) => { if (m?.id) manualMap.set(m.id, m); });
      (cloudCust.manualPurchases || []).forEach((m) => { if (m?.id) manualMap.set(m.id, m); });

      custMap.set(key, {
        ...localCust,
        ...cloudCust,
        ledgerEntries: Array.from(ledgerMap.values()),
        manualPurchases: Array.from(manualMap.values()),
      });
    }
  });

  return {
    inventory: Array.from(invMap.values()),
    sales: Array.from(salesMap.values()),
    customers: Array.from(custMap.values()),
    settings: cloud.settings || local.settings,
  };
}

/**
 * Push local store state to Firebase Firestore and the central server
 * so phone and desktop system stay in exact continuous sync
 */
export async function pushStoreToCloud(payload: SyncPayload): Promise<SyncResult> {
  const deviceType = getClientDeviceType();
  const sourceDevice = deviceType === 'phone' ? 'Mobile Phone' : 'Desktop System';
  const nowIso = new Date().toISOString();

  let firestoreSuccess = false;
  let serverSuccess = false;
  let serverData: any = null;

  // 1. Primary: Save to Firebase Firestore
  try {
    const docRef = doc(db, 'store_state', 'main');
    await setDoc(
      docRef,
      {
        inventory: payload.inventory,
        sales: payload.sales,
        customers: payload.customers,
        settings: payload.settings,
        lastUpdatedBy: sourceDevice,
        lastSyncTime: nowIso,
      },
      { merge: true }
    );
    firestoreSuccess = true;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, 'store_state/main');
    } else {
      console.warn('[CloudSync] Firestore setDoc notice:', err);
    }
  }

  // 2. Secondary: Save to Express /api/sync endpoint
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sourceDevice,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        serverSuccess = true;
        serverData = json.data;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Server POST /api/sync failed (will rely on Firestore)', err);
  }

  if (firestoreSuccess || serverSuccess) {
    return {
      success: true,
      message: 'Successfully synced entries to Cloud & System',
      data: serverData || {
        ...payload,
        lastSyncTime: nowIso,
        lastUpdatedBy: sourceDevice,
      },
    };
  }

  return { success: false, message: 'Cloud sync pending network connection' };
}

/**
 * Pull latest master data from Firebase Firestore and central server
 * and merge them so any entry made on phone is immediately present on the system
 */
export async function pullStoreFromCloud(): Promise<SyncResult> {
  let firestoreData: SyncPayload | null = null;
  let serverData: SyncPayload | null = null;

  // 1. Fetch from Firebase Firestore
  try {
    const docRef = doc(db, 'store_state', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data && (Array.isArray(data.inventory) || Array.isArray(data.sales) || Array.isArray(data.customers))) {
        firestoreData = {
          inventory: data.inventory || [],
          sales: data.sales || [],
          customers: data.customers || [],
          settings: data.settings,
        };
      }
    }
  } catch (fErr: any) {
    if (fErr?.code === 'permission-denied') {
      handleFirestoreError(fErr, OperationType.GET, 'store_state/main');
    } else {
      console.warn('[CloudSync] Firestore pull error:', fErr);
    }
  }

  // 2. Fetch from Express /api/sync endpoint
  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        serverData = json.data;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Server GET /api/sync notice (relying on Firestore):', err);
  }

  // If both exist, merge them together so no phone or system entry is ever lost!
  if (firestoreData && serverData) {
    const merged = mergeStoreDatasets(serverData, firestoreData);
    return {
      success: true,
      data: {
        ...merged,
        lastSyncTime: (firestoreData as any).lastSyncTime || (serverData as any).lastSyncTime || new Date().toISOString(),
      },
    };
  }

  if (firestoreData) {
    return { success: true, data: firestoreData };
  }

  if (serverData) {
    return { success: true, data: serverData };
  }

  return { success: false, message: 'No remote cloud data found' };
}

/**
 * Sets up real-time listener via Firebase Firestore onSnapshot,
 * Server-Sent Events (SSE), and periodic polling for instant cross-device updates
 */
export function setupRealtimeSync(onCloudUpdate: (cloudData: SyncPayload) => void): () => void {
  let eventSource: EventSource | null = null;
  let intervalId: any = null;
  let unsubscribeFirestore: (() => void) | null = null;
  let isClosed = false;

  const pullAndNotify = async () => {
    if (isClosed) return;
    try {
      const res = await pullStoreFromCloud();
      if (res.success && res.data) {
        onCloudUpdate(res.data);
      }
    } catch {
      // ignore
    }
  };

  // 1. Firebase Firestore Real-Time onSnapshot listener
  try {
    const docRef = doc(db, 'store_state', 'main');
    unsubscribeFirestore = onSnapshot(
      docRef,
      (docSnap) => {
        if (isClosed) return;
        if (docSnap.exists()) {
          const fData = docSnap.data() as any;
          if (fData && (Array.isArray(fData.inventory) || Array.isArray(fData.sales) || Array.isArray(fData.customers))) {
            onCloudUpdate({
              inventory: fData.inventory || [],
              sales: fData.sales || [],
              customers: fData.customers || [],
              settings: fData.settings,
            });
          }
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'store_state/main');
        } else {
          console.warn('[CloudSync] Firestore real-time snapshot notice:', error);
        }
      }
    );
  } catch (err) {
    console.warn('[CloudSync] Failed to attach Firestore onSnapshot:', err);
  }

  // 2. SSE Server-Sent Events listener
  try {
    eventSource = new EventSource('/api/sync/events');
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'sync') {
          pullAndNotify();
        }
      } catch {
        // ignore
      }
    };
    eventSource.onerror = () => {
      // EventSource reconnects automatically
    };
  } catch (e) {
    console.warn('[CloudSync] EventSource not supported or failed', e);
  }

  // 3. Periodic Background polling every 4 seconds to guarantee phone entries appear promptly
  intervalId = setInterval(() => {
    pullAndNotify();
  }, 4000);

  return () => {
    isClosed = true;
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (eventSource) eventSource.close();
    if (intervalId) clearInterval(intervalId);
  };
}
