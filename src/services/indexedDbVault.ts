/**
 * High-Capacity IndexedDB Persistent Storage for Zafar Mobile Store Snapshots & Vaults.
 * IndexedDB provides hundreds of megabytes of reliable local storage, completely immune
 * to the browser's 5MB localStorage quota limit.
 */

import { ShopBackupData } from '../types/mobile';

const DB_NAME = 'zafar_mobile_vault_db';
const DB_VERSION = 1;
const SNAPSHOTS_STORE = 'gmail_snapshots';
const VAULT_STORE = 'system_vaults';

export interface StoredSnapshot {
  id: string;
  gmailId: string;
  timestamp: string;
  dateFormatted: string;
  reason: string;
  inventoryCount: number;
  salesCount: number;
  customersCount: number;
  data: ShopBackupData;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

export const isIDBAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
};

/**
 * Initializes and caches the IndexedDB connection.
 */
export const getVaultDB = (): Promise<IDBDatabase | null> => {
  if (!isIDBAvailable()) {
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Gmail Snapshots (indexed by id, searchable by gmailId and timestamp)
        if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
          const snapshotStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
          snapshotStore.createIndex('gmailId', 'gmailId', { unique: false });
          snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 2: System & Permanent Vaults
        if (!db.objectStoreNames.contains(VAULT_STORE)) {
          db.createObjectStore(VAULT_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (err) => {
        console.warn('[IndexedDB Vault] Database open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB Vault] Failed to open indexedDB:', e);
      resolve(null);
    }
  });

  return dbPromise;
};

/**
 * Stores a snapshot record into IndexedDB.
 */
export const idbSaveSnapshot = async (record: StoredSnapshot): Promise<boolean> => {
  try {
    const db = await getVaultDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction([SNAPSHOTS_STORE], 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE);
      const req = store.put(record);

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn('[IndexedDB Vault] Failed to put snapshot:', req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB Vault] idbSaveSnapshot exception:', err);
    return false;
  }
};

/**
 * Retrieves all snapshots matching a specific Gmail ID, sorted newest first.
 */
export const idbGetSnapshotsByGmail = async (gmailId: string): Promise<StoredSnapshot[]> => {
  try {
    const db = await getVaultDB();
    if (!db) return [];

    const cleanEmail = (gmailId || '').trim().toLowerCase();

    return new Promise((resolve) => {
      const tx = db.transaction([SNAPSHOTS_STORE], 'readonly');
      const store = tx.objectStore(SNAPSHOTS_STORE);
      const index = store.index('gmailId');
      const req = index.getAll(IDBKeyRange.only(cleanEmail));

      req.onsuccess = () => {
        const results: StoredSnapshot[] = req.result || [];
        // Sort descending by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };

      req.onerror = () => {
        console.warn('[IndexedDB Vault] Failed to get snapshots by Gmail:', req.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB Vault] idbGetSnapshotsByGmail exception:', err);
    return [];
  }
};

/**
 * Saves arbitrary key-value store data (e.g. permanent vault, latest emergency payload).
 */
export const idbSetVaultData = async (key: string, data: any): Promise<boolean> => {
  try {
    const db = await getVaultDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction([VAULT_STORE], 'readwrite');
      const store = tx.objectStore(VAULT_STORE);
      const req = store.put({ key, data, updatedAt: new Date().toISOString() });

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

/**
 * Retrieves arbitrary key-value data from the vault store.
 */
export const idbGetVaultData = async <T = any>(key: string): Promise<T | null> => {
  try {
    const db = await getVaultDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction([VAULT_STORE], 'readonly');
      const store = tx.objectStore(VAULT_STORE);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result ? (req.result.data as T) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};
