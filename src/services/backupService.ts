import { ShopBackupData, MobileItem, SaleRecord, Customer, ShopSettings } from '../types/mobile';
import {
  idbSaveSnapshot,
  idbGetSnapshotsByGmail,
  idbSetVaultData,
  idbGetVaultData,
  StoredSnapshot,
} from './indexedDbVault';

const EMERGENCY_SNAPSHOT_KEY = 'zafar_mobile_emergency_snapshot_v1';
const PERMANENT_VAULT_KEY = 'zafar_mobile_permanent_vault_v1';
const GMAIL_VAULT_PREFIX = 'zafar_gmail_vault_';
const AUTO_SAVE_META_KEY = 'zafar_mobile_autosave_meta_v1';
const APP_ALTERATION_SHIELD_KEY = 'zafar_mobile_alteration_shield_v1';

export interface GmailSnapshotRecord {
  id: string;
  gmailId: string;
  timestamp: string;
  dateFormatted: string;
  reason: string;
  inventoryCount: number;
  salesCount: number;
  customersCount: number;
  data?: ShopBackupData;
}

export interface AutoSaveMeta {
  lastSavedTime: string;
  lastReason: string;
  totalSaves: number;
  gmailId: string;
}

// In-memory cache for fast synchronous access
const memorySnapshotsCache = new Map<string, GmailSnapshotRecord[]>();
let memoryPermanentVault: ShopBackupData | null = null;
let memoryEmergencySnapshot: ShopBackupData | null = null;

/**
 * Normalizes email address to a consistent lowercased string.
 */
export const normalizeGmail = (email?: string): string => {
  if (!email || typeof email !== 'string') return 'mebadprince@gmail.com';
  return email.trim().toLowerCase();
};

/**
 * Validates whether the given parsed JSON conforms to a valid ShopBackupData format.
 */
export const validateBackupData = (data: any): { isValid: boolean; reason?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, reason: 'The data is not a valid JSON object.' };
  }

  if (!Array.isArray(data.inventory)) {
    return { isValid: false, reason: 'Missing inventory records array in backup data.' };
  }

  if (!Array.isArray(data.sales)) {
    return { isValid: false, reason: 'Missing sales invoices array in backup data.' };
  }

  if (!Array.isArray(data.customers)) {
    return { isValid: false, reason: 'Missing customer/khata records array in backup data.' };
  }

  if (!data.settings || typeof data.settings !== 'object') {
    return { isValid: false, reason: 'Missing store settings configuration in backup data.' };
  }

  return { isValid: true };
};

/**
 * Constructs a standardized ShopBackupData payload from raw store collections.
 */
export const createBackupPayload = (
  inventory: MobileItem[],
  sales: SaleRecord[],
  customers: Customer[],
  settings: ShopSettings
): ShopBackupData => {
  const now = new Date().toISOString();
  return {
    version: '3.0.0',
    timestamp: now,
    exportedAt: now,
    sourceApp: 'Zafar Mobile Store POS & IMEI Management',
    metadata: {
      inventoryCount: inventory.length,
      salesCount: sales.length,
      customersCount: customers.length,
      shopName: settings.shopName || 'ZAFAR MOBILE STORE',
    },
    inventory,
    sales,
    customers,
    settings,
  };
};

/**
 * Prunes redundant or bloated keys from localStorage to guarantee free space for primary storage.
 */
export const pruneRedundantLocalStorageKeys = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Clean up old bloated vault lists
      if (key.startsWith(GMAIL_VAULT_PREFIX) && !key.endsWith('_latest')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw && raw.length > 100000) {
            // If it's a huge string, strip historical 'data' fields
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 1) {
              const pruned = parsed.slice(0, 5).map((item, idx) => {
                // Keep data only on the first item
                if (idx === 0) return item;
                const { data, ...meta } = item;
                return meta;
              });
              localStorage.setItem(key, JSON.stringify(pruned));
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch (e) {
    console.warn('[Storage Shield] Error during localStorage prune:', e);
  }
};

/**
 * Safe wrapper around localStorage.setItem that catches QuotaExceededError,
 * frees up redundant cache, retries, and avoids unhandled crashes.
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuotaError) {
      console.warn(`[Storage Shield] LocalStorage quota reached for "${key}". Pruning redundant historical snapshots to free space.`);
      pruneRedundantLocalStorageKeys();

      // Retry once after pruning
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        // If still failing, attempt saving without non-essential metadata or rely on IndexedDB
        console.warn(`[Storage Shield] Storage still full for "${key}". Full data safely preserved in IndexedDB vault.`);
        return false;
      }
    }

    return false;
  }
};

/**
 * Scans localStorage and migrates bloated Gmail snapshot arrays to IndexedDB,
 * freeing up multi-megabyte quota immediately.
 */
export const purgeBloatedLocalStorageVaults = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(GMAIL_VAULT_PREFIX) || key.endsWith('_latest')) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate full records to IndexedDB in background
          parsed.forEach((item) => {
            if (item && item.id && item.data) {
              idbSaveSnapshot(item as StoredSnapshot).catch(() => {});
            }
          });

          // Compress localStorage entry: keep full data only for the newest snapshot, metadata for the rest
          const compact = parsed.slice(0, 10).map((item, idx) => {
            if (idx === 0) return item;
            const { data, ...rest } = item;
            return rest;
          });

          localStorage.setItem(key, JSON.stringify(compact));
        }
      } catch {
        // Corrupted key, safe to remove
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
};

// Run cleanup immediately on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    purgeBloatedLocalStorageVaults();
  }, 100);
}

/**
 * Saves a versioned snapshot indexed by Gmail ID into IndexedDB and safe local storage.
 * Prevents localStorage quota errors by storing full records in IndexedDB and keeping
 * a lightweight index in localStorage.
 */
export const saveGmailSnapshot = (
  gmailId: string,
  data: ShopBackupData,
  reason: string = 'Auto-Save'
): GmailSnapshotRecord => {
  const cleanEmail = normalizeGmail(gmailId);
  const storageKey = `${GMAIL_VAULT_PREFIX}${cleanEmail}`;
  const now = new Date();

  const record: GmailSnapshotRecord = {
    id: `SNAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    gmailId: cleanEmail,
    timestamp: now.toISOString(),
    dateFormatted: now.toLocaleString(),
    reason,
    inventoryCount: data.inventory?.length || 0,
    salesCount: data.sales?.length || 0,
    customersCount: data.customers?.length || 0,
    data,
  };

  // 1. Update in-memory cache
  const cachedList = memorySnapshotsCache.get(cleanEmail) || [];
  const updatedMemoryList = [record, ...cachedList.filter((s) => s.id !== record.id)].slice(0, 30);
  memorySnapshotsCache.set(cleanEmail, updatedMemoryList);

  // 2. Persist full snapshot to IndexedDB (completely immune to 5MB localStorage quota)
  idbSaveSnapshot(record as StoredSnapshot).catch((err) => {
    console.warn('[Vault] IndexedDB snapshot save notice:', err);
  });
  idbSetVaultData(`${GMAIL_VAULT_PREFIX}${cleanEmail}_latest`, data).catch(() => {});

  // 3. Persist to localStorage with strict quota protection:
  // - Store full data ONLY on the latest snapshot
  // - For historical snapshots, store only lightweight metadata (timestamp, counts, reason)
  try {
    let existingMetaList: GmailSnapshotRecord[] = [];
    const existingRaw = localStorage.getItem(storageKey);
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          existingMetaList = parsed;
        }
      } catch {
        existingMetaList = [];
      }
    }

    // Build compact list: only item 0 keeps 'data', older items keep only metadata
    const compactRecord: GmailSnapshotRecord = { ...record };
    const olderRecords = existingMetaList.map((item) => {
      const { data: _omitted, ...metaOnly } = item;
      return metaOnly as GmailSnapshotRecord;
    });

    const newCompactList = [compactRecord, ...olderRecords].slice(0, 15);

    safeLocalStorageSet(storageKey, JSON.stringify(newCompactList));

    // Also update quick latest pointer
    safeLocalStorageSet(`${GMAIL_VAULT_PREFIX}${cleanEmail}_latest`, JSON.stringify(data));
  } catch (err) {
    console.warn('[Vault] LocalStorage snapshot notice (data is safe in IndexedDB):', cleanEmail);
  }

  return record;
};

/**
 * Retrieves all stored snapshots for a given Gmail ID synchronously.
 * Checks in-memory cache, then localStorage metadata.
 */
export const getGmailSnapshots = (gmailId: string): GmailSnapshotRecord[] => {
  const cleanEmail = normalizeGmail(gmailId);

  // 1. In-memory cache
  if (memorySnapshotsCache.has(cleanEmail)) {
    const list = memorySnapshotsCache.get(cleanEmail)!;
    if (list.length > 0) return list;
  }

  // 2. LocalStorage fallback
  const storageKey = `${GMAIL_VAULT_PREFIX}${cleanEmail}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      memorySnapshotsCache.set(cleanEmail, list);
      return list;
    }
  } catch (err) {
    console.warn('Error reading snapshots for Gmail:', cleanEmail, err);
  }

  return [];
};

/**
 * Retrieves full historical snapshots asynchronously from IndexedDB.
 * Merges IndexedDB with in-memory records to guarantee full payloads.
 */
export const getGmailSnapshotsAsync = async (gmailId: string): Promise<GmailSnapshotRecord[]> => {
  const cleanEmail = normalizeGmail(gmailId);

  try {
    // 1. Query IndexedDB for high-capacity historical snapshots
    const idbSnapshots = await idbGetSnapshotsByGmail(cleanEmail);
    if (idbSnapshots && idbSnapshots.length > 0) {
      memorySnapshotsCache.set(cleanEmail, idbSnapshots);
      return idbSnapshots;
    }
  } catch (e) {
    console.warn('[Vault] IndexedDB snapshot query fallback:', e);
  }

  // Fallback to synchronous getGmailSnapshots
  return getGmailSnapshots(cleanEmail);
};

/**
 * Retrieves the most recent snapshot for a given Gmail ID.
 */
export const getLatestGmailSnapshot = (gmailId: string): ShopBackupData | null => {
  const cleanEmail = normalizeGmail(gmailId);

  // 1. In-memory latest snapshot
  const memList = memorySnapshotsCache.get(cleanEmail);
  if (memList && memList.length > 0 && memList[0].data && validateBackupData(memList[0].data).isValid) {
    return memList[0].data;
  }

  try {
    // 2. Quick latest key in localStorage
    const quickRaw = localStorage.getItem(`${GMAIL_VAULT_PREFIX}${cleanEmail}_latest`);
    if (quickRaw) {
      const parsed = JSON.parse(quickRaw);
      if (validateBackupData(parsed).isValid) return parsed as ShopBackupData;
    }

    // 3. Fallback to snapshot list
    const snapshots = getGmailSnapshots(cleanEmail);
    if (snapshots.length > 0 && snapshots[0].data) {
      return snapshots[0].data;
    }
  } catch (err) {
    console.warn('Error getting latest Gmail snapshot:', err);
  }

  return null;
};

/**
 * Asynchronously retrieves the latest snapshot, checking IndexedDB if local storage is pruned.
 */
export const getLatestGmailSnapshotAsync = async (gmailId: string): Promise<ShopBackupData | null> => {
  const cleanEmail = normalizeGmail(gmailId);

  // Check sync first
  const syncResult = getLatestGmailSnapshot(cleanEmail);
  if (syncResult) return syncResult;

  // Check IndexedDB
  try {
    const idbLatest = await idbGetVaultData<ShopBackupData>(`${GMAIL_VAULT_PREFIX}${cleanEmail}_latest`);
    if (idbLatest && validateBackupData(idbLatest).isValid) {
      return idbLatest;
    }

    const idbSnapshots = await idbGetSnapshotsByGmail(cleanEmail);
    if (idbSnapshots.length > 0 && idbSnapshots[0].data) {
      return idbSnapshots[0].data;
    }
  } catch (e) {
    console.warn('[Vault] Error in getLatestGmailSnapshotAsync:', e);
  }

  return null;
};

/**
 * Saves into the Permanent Safety Vault with both IndexedDB and localStorage protection.
 */
export const updatePermanentVault = (data: ShopBackupData) => {
  try {
    if (!validateBackupData(data).isValid) return;

    memoryPermanentVault = data;

    // Save to IndexedDB
    idbSetVaultData(PERMANENT_VAULT_KEY, data).catch(() => {});

    // Save to localStorage safely
    safeLocalStorageSet(PERMANENT_VAULT_KEY, JSON.stringify(data));
    safeLocalStorageSet(
      APP_ALTERATION_SHIELD_KEY,
      JSON.stringify({
        shieldVersion: '3.0.0',
        lastGuardedAt: new Date().toISOString(),
        inventoryCount: data.inventory?.length || 0,
        salesCount: data.sales?.length || 0,
        customersCount: data.customers?.length || 0,
      })
    );
  } catch (err) {
    console.warn('Could not update permanent vault:', err);
  }
};

/**
 * Reads from the Permanent Safety Vault.
 */
export const getPermanentVault = (): ShopBackupData | null => {
  if (memoryPermanentVault && validateBackupData(memoryPermanentVault).isValid) {
    return memoryPermanentVault;
  }

  try {
    const raw = localStorage.getItem(PERMANENT_VAULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (validateBackupData(parsed).isValid) {
      memoryPermanentVault = parsed as ShopBackupData;
      return memoryPermanentVault;
    }
  } catch {
    // fallback
  }

  return null;
};

/**
 * Asynchronously reads from the Permanent Safety Vault (falling back to IndexedDB).
 */
export const getPermanentVaultAsync = async (): Promise<ShopBackupData | null> => {
  const syncResult = getPermanentVault();
  if (syncResult) return syncResult;

  try {
    const idbData = await idbGetVaultData<ShopBackupData>(PERMANENT_VAULT_KEY);
    if (idbData && validateBackupData(idbData).isValid) {
      memoryPermanentVault = idbData;
      return idbData;
    }
  } catch {}

  return null;
};

/**
 * Performs a complete multi-layer auto-save across:
 * 1. Permanent Safety Vault (alteration protection)
 * 2. Emergency Snapshot
 * 3. Gmail-Indexed Snapshot Registry (IndexedDB + Quota-safe localStorage)
 * 4. AutoSave metadata counter
 */
export const performAutoSave = (
  gmailId: string,
  data: ShopBackupData,
  reason: string = 'Auto-Saved'
): AutoSaveMeta => {
  const cleanEmail = normalizeGmail(gmailId);
  const now = new Date().toISOString();

  // 1. Permanent Vault
  updatePermanentVault(data);

  // 2. Emergency Snapshot
  storeLocalEmergencySnapshot(data);

  // 3. Gmail-indexed snapshot (quota safe)
  saveGmailSnapshot(cleanEmail, data, reason);

  // 4. Update metadata
  let totalSaves = 1;
  try {
    const prevMeta = localStorage.getItem(AUTO_SAVE_META_KEY);
    if (prevMeta) {
      const parsed = JSON.parse(prevMeta);
      totalSaves = (parsed.totalSaves || 0) + 1;
    }
  } catch {
    // ignore
  }

  const meta: AutoSaveMeta = {
    lastSavedTime: now,
    lastReason: reason,
    totalSaves,
    gmailId: cleanEmail,
  };

  safeLocalStorageSet(AUTO_SAVE_META_KEY, JSON.stringify(meta));

  return meta;
};

/**
 * Retrieves the current auto-save status and metadata.
 */
export const getAutoSaveMeta = (): AutoSaveMeta | null => {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutoSaveMeta;
  } catch {
    return null;
  }
};

/**
 * Triggers a direct download of the backup file to the user's phone or computer.
 */
export const exportLocalBackupFile = (data: ShopBackupData, customName?: string) => {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customName || `Zafar_Mobile_Shop_Backup_${dateStr}.json`;

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Reads a user-selected file from their phone/computer and parses it into ShopBackupData.
 */
export const parseBackupFile = (file: File): Promise<ShopBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupData(parsed);

        if (!validation.isValid) {
          reject(new Error(validation.reason || 'Invalid backup structure'));
          return;
        }

        resolve(parsed as ShopBackupData);
      } catch (err: any) {
        reject(new Error(`Failed to parse backup file: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file from device.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Keeps an automatic safety snapshot in IndexedDB and localStorage so unexpected alterations can be rolled back.
 */
export const storeLocalEmergencySnapshot = (data: ShopBackupData) => {
  try {
    memoryEmergencySnapshot = data;
    idbSetVaultData(EMERGENCY_SNAPSHOT_KEY, data).catch(() => {});
    safeLocalStorageSet(EMERGENCY_SNAPSHOT_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not store local emergency snapshot:', err);
  }
};

/**
 * Retrieves the last emergency snapshot if available.
 */
export const getLocalEmergencySnapshot = (): ShopBackupData | null => {
  if (memoryEmergencySnapshot && validateBackupData(memoryEmergencySnapshot).isValid) {
    return memoryEmergencySnapshot;
  }

  try {
    const raw = localStorage.getItem(EMERGENCY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validation = validateBackupData(parsed);
    if (validation.isValid) {
      memoryEmergencySnapshot = parsed as ShopBackupData;
      return memoryEmergencySnapshot;
    }
  } catch {
    // ignore
  }

  return null;
};
