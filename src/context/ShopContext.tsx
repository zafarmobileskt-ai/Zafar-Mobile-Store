import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  MobileItem, 
  SaleRecord, 
  ShopSettings, 
  DeviceStatus, 
  CustomerInfo, 
  WarrantyInfo, 
  TradeInDevice, 
  SellerSupplierInfo,
  Customer,
  ManualPurchaseLog,
  CustomerLedgerEntry
} from '../types/mobile';
import { initialSettings, sampleInventory, sampleSales, sampleCustomers } from '../data/seedData';
import { 
  exportCompleteShopWorkbook, 
  exportInventorySheet, 
  exportSalesSheet, 
  exportCustomersSheet,
  generateGmailBackupDraft 
} from '../utils/sheetExport';
import { exportCompleteShopPDF } from '../utils/pdfExport';
import {
  createBackupPayload,
  validateBackupData,
  saveGmailSnapshot,
  getGmailSnapshots,
  getGmailSnapshotsAsync,
  getLatestGmailSnapshot,
  getLatestGmailSnapshotAsync,
  updatePermanentVault,
  getPermanentVault,
  getPermanentVaultAsync,
  performAutoSave,
  getAutoSaveMeta,
  getLocalEmergencySnapshot,
  storeLocalEmergencySnapshot,
  normalizeGmail,
  GmailSnapshotRecord,
  AutoSaveMeta,
} from '../services/backupService';
import {
  listDriveBackups,
  downloadBackupFromDrive,
  uploadBackupToDrive,
  getAccessToken,
} from '../services/googleDriveService';
import {
  pushStoreToCloud,
  pullStoreFromCloud,
  setupRealtimeSync,
  mergeStoreDatasets
} from '../services/cloudSyncService';

interface ShopContextType {
  inventory: MobileItem[];
  sales: SaleRecord[];
  customers: Customer[];
  settings: ShopSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Auto-Save & Cloud Vault
  lastAutoSaveTime: string;
  isAutoSaving: boolean;
  autoSaveStatus: string;
  
  // Gmail ID Restore & Backup Operations
  restoreWithGmailId: (gmailId: string, snapshotId?: string) => Promise<{ success: boolean; message: string; counts?: { inventory: number; sales: number; customers: number } }>;
  restoreFullBackup: (data: any) => { success: boolean; message: string; counts?: { inventory: number; sales: number; customers: number } };
  triggerGmailCloudSync: (customEmail?: string, reason?: string) => Promise<{ success: boolean; message: string; driveUploaded?: boolean }>;
  getAvailableGmailBackups: (gmailId?: string) => Promise<Array<{
    id: string;
    name: string;
    timestamp: string;
    dateFormatted: string;
    source: 'drive' | 'local_vault';
    inventoryCount: number;
    salesCount: number;
    customersCount: number;
    reason?: string;
    data?: any;
  }>>;
  
  // Mobile Operations
  addMobile: (data: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'>) => MobileItem;
  updateMobile: (id: string, data: Partial<MobileItem>) => void;
  deleteMobile: (id: string) => void;
  updateMobileStatus: (id: string, status: DeviceStatus) => void;
  getMobileById: (id: string) => MobileItem | undefined;
  getDeviceByImei: (imeiQuery: string) => MobileItem | undefined;
  
  // Customer Operations
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  addManualPurchaseToCustomer: (customerId: string, purchase: Omit<ManualPurchaseLog, 'id'>) => void;
  updateManualPurchase: (customerId: string, purchaseId: string, updates: Partial<ManualPurchaseLog>) => void;
  deleteManualPurchase: (customerId: string, purchaseId: string) => void;
  addCustomerLedgerEntry: (customerId: string, entry: Omit<CustomerLedgerEntry, 'id' | 'createdAt'>) => CustomerLedgerEntry;
  updateCustomerLedgerEntry: (customerId: string, entryId: string, updates: Partial<CustomerLedgerEntry>) => void;
  deleteCustomerLedgerEntry: (customerId: string, entryId: string) => void;
  importCustomersBatch: (list: Array<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => number;

  // Sales Operations
  recordSale: (saleInput: {
    deviceId: string;
    soldPrice: number;
    discount: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Split Payment' | 'Trade-In Balance';
    customer: CustomerInfo;
    warranty: WarrantyInfo;
    tradeInItem?: TradeInDevice;
    soldBy: string;
    notes?: string;
    paymentType?: 'full' | 'partial' | 'credit';
    amountPaidNow?: number;
    creditDueDate?: string;
    saleDate?: string;
  }) => SaleRecord;
  updateSale: (saleId: string, updates: Partial<SaleRecord>) => void;
  
  // Buy Used Phone & Trade-in Operations
  recordUsedIntake: (data: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'>) => MobileItem;
  
  // Settings & Utilities
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  formatCurrency: (amount: number) => string;
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => { success: boolean; message: string };
  resetToSampleData: () => void;
  
  // Master Single File PDF & Spreadsheet Exports
  exportAllToPDF: (generatedBy?: string) => void;
  exportAllToSheets: () => void;
  exportInventoryToSheets: (format?: 'xlsx' | 'csv') => void;
  exportSalesToSheets: (format?: 'xlsx' | 'csv') => void;
  exportCustomersToSheets: (format?: 'xlsx' | 'csv') => void;
  triggerGmailBackup: (emailId?: string) => { gmailWebUrl: string; mailtoUrl: string; summaryText: string };
  
  // Modals / Quick Actions State
  selectedDeviceForModal: MobileItem | null;
  setSelectedDeviceForModal: (device: MobileItem | null) => void;
  selectedInvoiceForModal: SaleRecord | null;
  setSelectedInvoiceForModal: (sale: SaleRecord | null) => void;
  selectedPoliceCertDevice: MobileItem | null;
  setSelectedPoliceCertDevice: (device: MobileItem | null) => void;
  selectedCustomerForModal: Customer | null;
  setSelectedCustomerForModal: (customer: Customer | null) => void;
  customerToEdit: Customer | null;
  setCustomerToEdit: (customer: Customer | null) => void;
  deviceToEdit: MobileItem | null;
  setDeviceToEdit: (item: MobileItem | null) => void;
  ledgerEntryToEdit: { customerId: string; entry: CustomerLedgerEntry } | null;
  setLedgerEntryToEdit: (data: { customerId: string; entry: CustomerLedgerEntry } | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isAddCustomerModalOpen: boolean;
  setIsAddCustomerModalOpen: (open: boolean) => void;
  isContactImportModalOpen: boolean;
  setIsContactImportModalOpen: (open: boolean) => void;
  isAddLedgerModalOpen: boolean;
  setIsAddLedgerModalOpen: (open: boolean) => void;
  selectedCustomerForLedger: Customer | null;
  setSelectedCustomerForLedger: (c: Customer | null) => void;
  ledgerInitialType: 'debit' | 'credit';
  setLedgerInitialType: (t: 'debit' | 'credit') => void;
  isImeiSearchOpen: boolean;
  setIsImeiSearchOpen: (open: boolean) => void;
  isPosModalOpen: boolean;
  setIsPosModalOpen: (open: boolean) => void;
  selectedDeviceForSale: MobileItem | null;
  setSelectedDeviceForSale: (device: MobileItem | null) => void;
  selectedCustomerForSale: Customer | null;
  setSelectedCustomerForSale: (customer: Customer | null) => void;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
  isVoiceAssistantOpen: boolean;
  setIsVoiceAssistantOpen: (open: boolean) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSyncTime: string | null;
  forceSyncNow: () => Promise<void>;
  syncNotification: string | null;
  clearSyncNotification: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const INVENTORY_STORAGE_KEY = 'zafar_mobile_inventory_v1';
const SALES_STORAGE_KEY = 'zafar_mobile_sales_v1';
const CUSTOMERS_STORAGE_KEY = 'zafar_mobile_customers_v1';
const SETTINGS_STORAGE_KEY = 'zafar_mobile_settings_v1';

// Helper to generate guaranteed collision-resistant unique IDs
const generateSecureId = (prefix: string, existingList?: Array<{ id?: string; saleId?: string }>): string => {
  let id = '';
  let count = 0;
  do {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    id = `${prefix}-${timestamp}-${randomHex}${count > 0 ? `-${count}` : ''}`;
    count++;
  } while (
    existingList && 
    existingList.some((item) => item.id === id || item.saleId === id) && 
    count < 100
  );
  return id;
};

// Sanitizer to heal any corrupted state, merge duplicates, and ensure strict key uniqueness
const sanitizeCustomersList = (list: Customer[]): Customer[] => {
  if (!Array.isArray(list)) return [];
  const result: Customer[] = [];
  const seenIds = new Set<string>();

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const cust: Customer = { ...item };
    
    // Normalize phone and name for duplicate detection
    const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    const cleanName = (cust.name || '').trim().toLowerCase();

    // Check if an identical customer profile already exists in the accumulator
    const existingIndex = result.findIndex((existing) => {
      if (existing.id === cust.id) return true;
      if (cleanPhone && existing.phone) {
        const existingCleanPhone = existing.phone.replace(/\D/g, '');
        if (existingCleanPhone && existingCleanPhone === cleanPhone) return true;
      }
      if (cleanName && existing.name && existing.name.trim().toLowerCase() === cleanName && (!cleanPhone || !existing.phone)) {
        return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      // Merge ledger entries, manual purchases, tags, and preferences into existing profile
      const existing = result[existingIndex];
      const existingLedgerIds = new Set((existing.ledgerEntries || []).map((l) => l.id));
      const extraLedger = (cust.ledgerEntries || []).filter((l) => !existingLedgerIds.has(l.id));
      
      const existingManualIds = new Set((existing.manualPurchases || []).map((m) => m.id));
      const extraManual = (cust.manualPurchases || []).filter((m) => !existingManualIds.has(m.id));

      result[existingIndex] = {
        ...existing,
        name: existing.name || cust.name,
        email: existing.email || cust.email,
        address: existing.address || cust.address,
        cnicOrGovId: existing.cnicOrGovId || cust.cnicOrGovId,
        tags: Array.from(new Set([...(existing.tags || []), ...(cust.tags || [])])),
        preferences: {
          preferredBrands: Array.from(new Set([...(existing.preferences?.preferredBrands || []), ...(cust.preferences?.preferredBrands || [])])),
          whatsappAlerts: existing.preferences?.whatsappAlerts ?? cust.preferences?.whatsappAlerts ?? true,
        },
        ledgerEntries: [...(existing.ledgerEntries || []), ...extraLedger],
        manualPurchases: [...(existing.manualPurchases || []), ...extraManual],
      };
      // Skip pushing duplicate item
      continue;
    }

    // Ensure ID is present and unique
    if (!cust.id || seenIds.has(cust.id)) {
      cust.id = generateSecureId('CUST', result);
    }

    seenIds.add(cust.id);
    result.push(cust);
  }

  return result;
};

const sanitizeInventoryList = (list: MobileItem[]): MobileItem[] => {
  if (!Array.isArray(list)) return [];
  const result: MobileItem[] = [];
  const seenIds = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const finalItem = { ...item };
    if (!finalItem.id || seenIds.has(finalItem.id)) {
      finalItem.id = generateSecureId('MOB', result);
    }
    // Convert small legacy USD amounts to realistic Pakistani Rupee values
    if (finalItem.purchaseCost > 0 && finalItem.purchaseCost < 5000) {
      finalItem.purchaseCost = Math.round(finalItem.purchaseCost * 280);
    }
    if (finalItem.sellingPriceTarget > 0 && finalItem.sellingPriceTarget < 5000) {
      finalItem.sellingPriceTarget = Math.round(finalItem.sellingPriceTarget * 280);
    }
    if (finalItem.minPrice > 0 && finalItem.minPrice < 5000) {
      finalItem.minPrice = Math.round(finalItem.minPrice * 280);
    }
    seenIds.add(finalItem.id);
    result.push(finalItem);
  }
  return result;
};

const sanitizeSalesList = (list: SaleRecord[]): SaleRecord[] => {
  if (!Array.isArray(list)) return [];
  const result: SaleRecord[] = [];
  const seenIds = new Set<string>();
  for (const sale of list) {
    if (!sale || typeof sale !== 'object') continue;
    const finalSale = { ...sale };
    const saleIdKey = finalSale.saleId || (sale as any).id;
    if (!saleIdKey || seenIds.has(saleIdKey)) {
      finalSale.saleId = generateSecureId('SALE', result);
    }
    // Convert small legacy USD amounts to realistic Pakistani Rupee values
    if (finalSale.soldPrice > 0 && finalSale.soldPrice < 5000) {
      finalSale.soldPrice = Math.round(finalSale.soldPrice * 280);
      finalSale.purchaseCost = Math.round(finalSale.purchaseCost * 280);
      finalSale.finalAmount = Math.round(finalSale.finalAmount * 280);
      finalSale.profit = Math.round(finalSale.profit * 280);
      if (finalSale.discount > 0 && finalSale.discount < 500) {
        finalSale.discount = Math.round(finalSale.discount * 280);
      }
    }
    seenIds.add(finalSale.saleId);
    result.push(finalSale);
  }
  return result;
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-tier recovery check: Primary localStorage -> Permanent Safety Vault -> Gmail Snapshots -> Emergency snapshot -> Sample data
  const [inventory, setInventory] = useState<MobileItem[]>(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY) || localStorage.getItem('apex_mobile_inventory_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizeInventoryList(parsed);
      }
      const vault = getPermanentVault();
      if (vault?.inventory && Array.isArray(vault.inventory) && vault.inventory.length > 0) {
        return sanitizeInventoryList(vault.inventory);
      }
      const gmailSnapshot = getLatestGmailSnapshot('mebadprince@gmail.com');
      if (gmailSnapshot?.inventory && Array.isArray(gmailSnapshot.inventory) && gmailSnapshot.inventory.length > 0) {
        return sanitizeInventoryList(gmailSnapshot.inventory);
      }
      const emergency = getLocalEmergencySnapshot();
      if (emergency?.inventory && Array.isArray(emergency.inventory) && emergency.inventory.length > 0) {
        return sanitizeInventoryList(emergency.inventory);
      }
    } catch (e) {
      console.error('Failed reading inventory from localStorage', e);
    }
    return sanitizeInventoryList(sampleInventory);
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SALES_STORAGE_KEY) || localStorage.getItem('apex_mobile_sales_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizeSalesList(parsed);
      }
      const vault = getPermanentVault();
      if (vault?.sales && Array.isArray(vault.sales) && vault.sales.length > 0) {
        return sanitizeSalesList(vault.sales);
      }
      const gmailSnapshot = getLatestGmailSnapshot('mebadprince@gmail.com');
      if (gmailSnapshot?.sales && Array.isArray(gmailSnapshot.sales) && gmailSnapshot.sales.length > 0) {
        return sanitizeSalesList(gmailSnapshot.sales);
      }
      const emergency = getLocalEmergencySnapshot();
      if (emergency?.sales && Array.isArray(emergency.sales) && emergency.sales.length > 0) {
        return sanitizeSalesList(emergency.sales);
      }
    } catch (e) {
      console.error('Failed reading sales from localStorage', e);
    }
    return sanitizeSalesList(sampleSales);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizeCustomersList(parsed);
      }
      const vault = getPermanentVault();
      if (vault?.customers && Array.isArray(vault.customers) && vault.customers.length > 0) {
        return sanitizeCustomersList(vault.customers);
      }
      const gmailSnapshot = getLatestGmailSnapshot('mebadprince@gmail.com');
      if (gmailSnapshot?.customers && Array.isArray(gmailSnapshot.customers) && gmailSnapshot.customers.length > 0) {
        return sanitizeCustomersList(gmailSnapshot.customers);
      }
      const emergency = getLocalEmergencySnapshot();
      if (emergency?.customers && Array.isArray(emergency.customers) && emergency.customers.length > 0) {
        return sanitizeCustomersList(emergency.customers);
      }
    } catch (e) {
      console.error('Failed reading customers from localStorage', e);
    }
    return sanitizeCustomersList(sampleCustomers);
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem('apex_mobile_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName === 'Apex Mobile Zone & Tech Hub') {
          parsed.shopName = 'ZAFAR MOBILE STORE';
        }
        if (!parsed.backupGmail) {
          parsed.backupGmail = 'mebadprince@gmail.com';
        }
        // User requested: Show value in PKR
        if (!parsed.currency || parsed.currency === 'USD') {
          parsed.currency = 'PKR';
          parsed.currencySymbol = 'PKR ';
        }
        return parsed;
      }
      const vault = getPermanentVault();
      if (vault?.settings) {
        return { 
          ...vault.settings, 
          currency: vault.settings.currency === 'USD' ? 'PKR' : (vault.settings.currency || 'PKR'),
          currencySymbol: vault.settings.currencySymbol === '$' ? 'PKR ' : (vault.settings.currencySymbol || 'PKR '),
          backupGmail: vault.settings.backupGmail || 'mebadprince@gmail.com' 
        };
      }
    } catch (e) {
      console.error('Failed reading settings from localStorage', e);
    }
    return { ...initialSettings, currency: 'PKR', currencySymbol: 'PKR ', backupGmail: 'mebadprince@gmail.com' };
  });

  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>(() => {
    const meta = getAutoSaveMeta();
    return meta?.lastSavedTime || new Date().toISOString();
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Auto-Save Active (Protected)');

  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  // Modal states
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState<MobileItem | null>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<SaleRecord | null>(null);
  const [selectedPoliceCertDevice, setSelectedPoliceCertDevice] = useState<MobileItem | null>(null);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [deviceToEdit, setDeviceToEdit] = useState<MobileItem | null>(null);
  const [ledgerEntryToEdit, setLedgerEntryToEdit] = useState<{ customerId: string; entry: CustomerLedgerEntry } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [isContactImportModalOpen, setIsContactImportModalOpen] = useState<boolean>(false);
  const [isAddLedgerModalOpen, setIsAddLedgerModalOpen] = useState<boolean>(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [ledgerInitialType, setLedgerInitialType] = useState<'debit' | 'credit'>('debit');
  const [isImeiSearchOpen, setIsImeiSearchOpen] = useState<boolean>(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState<boolean>(false);
  const [selectedDeviceForSale, setSelectedDeviceForSale] = useState<MobileItem | null>(null);
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState<Customer | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);

  // Cross-device cloud sync states
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const isUpdatingFromCloud = useRef(false);
  const syncDebounceTimer = useRef<any>(null);

  // 1. Initial Cloud Sync on Mount & Real-time listener for incoming changes from other devices (e.g. Phone -> PC)
  useEffect(() => {
    // Initial fetch from cloud master
    pullStoreFromCloud().then((res) => {
      if (res.success && res.data) {
        const cloudData = res.data;
        isUpdatingFromCloud.current = true;
        setInventory((prevInv) => {
          const merged = mergeStoreDatasets({ inventory: prevInv, sales: [], customers: [], settings }, cloudData);
          return sanitizeInventoryList(merged.inventory);
        });
        setSales((prevSales) => {
          const merged = mergeStoreDatasets({ inventory: [], sales: prevSales, customers: [], settings }, cloudData);
          return sanitizeSalesList(merged.sales);
        });
        setCustomers((prevCusts) => {
          const merged = mergeStoreDatasets({ inventory: [], sales: [], customers: prevCusts, settings }, cloudData);
          return sanitizeCustomersList(merged.customers);
        });
        if (cloudData.settings) {
          setSettings((prev) => ({ ...prev, ...cloudData.settings }));
        }
        setLastCloudSyncTime(new Date().toLocaleTimeString());
        setCloudSyncStatus('synced');
        setTimeout(() => {
          isUpdatingFromCloud.current = false;
        }, 500);
      } else {
        // If cloud had nothing yet, push local storage to cloud so other devices have it!
        pushStoreToCloud({ inventory, sales, customers, settings });
      }
    });

    // Setup real-time listener (SSE + interval polling + Firestore snapshot)
    const cleanup = setupRealtimeSync((cloudData) => {
      if (isUpdatingFromCloud.current) return;
      isUpdatingFromCloud.current = true;

      setInventory((prevInv) => {
        const merged = mergeStoreDatasets({ inventory: prevInv, sales: [], customers: [], settings }, cloudData);
        return sanitizeInventoryList(merged.inventory);
      });
      setSales((prevSales) => {
        const merged = mergeStoreDatasets({ inventory: [], sales: prevSales, customers: [], settings }, cloudData);
        return sanitizeSalesList(merged.sales);
      });
      setCustomers((prevCusts) => {
        const merged = mergeStoreDatasets({ inventory: [], sales: [], customers: prevCusts, settings }, cloudData);
        return sanitizeCustomersList(merged.customers);
      });
      if (cloudData.settings) {
        setSettings((prev) => ({ ...prev, ...cloudData.settings }));
      }
      setLastCloudSyncTime(new Date().toLocaleTimeString());
      setCloudSyncStatus('synced');
      setSyncNotification('Synchronized live entries with Mobile Phone / System');
      setTimeout(() => {
        isUpdatingFromCloud.current = false;
      }, 500);
    });

    return () => {
      cleanup();
    };
  }, []);

  // Sync to local storage & Continuous Auto-Save with Multi-Layer Alteration Protection
  useEffect(() => {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

      const targetEmail = normalizeGmail(settings.backupGmail || 'mebadprince@gmail.com');
      const payload = createBackupPayload(inventory, sales, customers, settings);
      
      const meta = performAutoSave(targetEmail, payload, 'Auto-Saved on Change');
      setLastAutoSaveTime(meta.lastSavedTime);
      setAutoSaveStatus(`Auto-saved to Vault & Gmail (${targetEmail})`);

      // Push to central cloud if not currently receiving a cloud update
      if (!isUpdatingFromCloud.current) {
        setCloudSyncStatus('syncing');
        clearTimeout(syncDebounceTimer.current);
        syncDebounceTimer.current = setTimeout(() => {
          pushStoreToCloud({ inventory, sales, customers, settings })
            .then((res) => {
              if (res.success) {
                setCloudSyncStatus('synced');
                setLastCloudSyncTime(new Date().toLocaleTimeString());
              }
            })
            .catch(() => {
              setCloudSyncStatus('offline');
            });
        }, 350);
      }
    } catch (err) {
      console.warn('Auto-save error:', err);
    }
  }, [inventory, sales, customers, settings]);

  const formatCurrency = (amount: number): string => {
    const symbol = settings.currencySymbol || 'PKR ';
    return `${symbol}${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const getMobileById = (id: string) => {
    return inventory.find((item) => item.id === id);
  };

  const getDeviceByImei = (query: string): MobileItem | undefined => {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) return undefined;
    return inventory.find(
      (item) =>
        item.imei1?.toLowerCase().includes(cleaned) ||
        (item.imei2 && item.imei2.toLowerCase().includes(cleaned)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(cleaned)) ||
        item.id.toLowerCase() === cleaned
    );
  };

  const addMobile = (data: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'>): MobileItem => {
    const now = new Date().toISOString();
    const newId = generateSecureId('MOB', inventory);
    const newItem: MobileItem = {
      ...data,
      id: newId,
      status: data.status || 'in_stock',
      createdAt: now,
      updatedAt: now,
    };

    setInventory((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateMobile = (id: string, data: Partial<MobileItem>) => {
    const now = new Date().toISOString();
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data, updatedAt: now };
          if (selectedDeviceForModal?.id === id) {
            setSelectedDeviceForModal(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const deleteMobile = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    if (selectedDeviceForModal?.id === id) {
      setSelectedDeviceForModal(null);
    }
  };

  const updateMobileStatus = (id: string, status: DeviceStatus) => {
    updateMobile(id, { status });
  };

  // Customer Management
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const now = new Date().toISOString();
    const cleanPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
    const cleanName = (data.name || '').trim().toLowerCase();

    // Check if customer already exists by phone or exact name
    const existingIndex = customers.findIndex((c) => {
      if (cleanPhone && c.phone) {
        const existingCleanPhone = c.phone.replace(/\D/g, '');
        if (existingCleanPhone && existingCleanPhone === cleanPhone) return true;
      }
      if (cleanName && c.name && c.name.trim().toLowerCase() === cleanName && (!cleanPhone || !c.phone)) {
        return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      const existing = customers[existingIndex];
      const updated: Customer = {
        ...existing,
        name: data.name || existing.name,
        email: data.email || existing.email,
        address: data.address || existing.address,
        cnicOrGovId: data.cnicOrGovId || existing.cnicOrGovId,
        tags: Array.from(new Set([...(existing.tags || []), ...(data.tags || [])])),
        preferences: {
          preferredBrands: Array.from(new Set([...(existing.preferences?.preferredBrands || []), ...(data.preferences?.preferredBrands || [])])),
          whatsappAlerts: data.preferences?.whatsappAlerts ?? existing.preferences?.whatsappAlerts ?? true,
        },
        ledgerEntries: [...(data.ledgerEntries || []), ...(existing.ledgerEntries || [])],
        manualPurchases: [...(data.manualPurchases || []), ...(existing.manualPurchases || [])],
        updatedAt: now,
      };

      setCustomers((prev) => prev.map((c) => (c.id === existing.id ? updated : c)));
      return updated;
    }

    const newId = generateSecureId('CUST', customers);
    const newCustomer: Customer = {
      ...data,
      id: newId,
      tags: data.tags?.length ? data.tags : ['New Customer'],
      preferences: data.preferences || { preferredBrands: [] },
      manualPurchases: data.manualPurchases || [],
      ledgerEntries: data.ledgerEntries || [],
      createdAt: now,
      updatedAt: now,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data, updatedAt: now };
          if (selectedCustomerForModal?.id === id) {
            setSelectedCustomerForModal(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomerForModal?.id === id) {
      setSelectedCustomerForModal(null);
    }
  };

  const getCustomerById = (id: string) => {
    return customers.find((c) => c.id === id);
  };

  const getCustomerByPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return undefined;
    return customers.find((c) => c.phone.replace(/\D/g, '').includes(cleaned) || cleaned.includes(c.phone.replace(/\D/g, '')));
  };

  const addManualPurchaseToCustomer = (customerId: string, purchase: Omit<ManualPurchaseLog, 'id'>) => {
    const now = new Date().toISOString();
    const purchaseId = generateSecureId('MP');
    const newPurchase: ManualPurchaseLog = {
      ...purchase,
      id: purchaseId,
      date: purchase.date || now,
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedPurchases = [newPurchase, ...(c.manualPurchases || [])];
          const updated = { ...c, manualPurchases: updatedPurchases, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteManualPurchase = (customerId: string, purchaseId: string) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedPurchases = (c.manualPurchases || []).filter((p) => p.id !== purchaseId);
          const updated = { ...c, manualPurchases: updatedPurchases, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const updateManualPurchase = (
    customerId: string,
    purchaseId: string,
    updates: Partial<ManualPurchaseLog>
  ) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedPurchases = (c.manualPurchases || []).map((p) => {
            if (p.id === purchaseId) {
              return { ...p, ...updates };
            }
            return p;
          });
          const updated = { ...c, manualPurchases: updatedPurchases, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const addCustomerLedgerEntry = (
    customerId: string,
    entry: Omit<CustomerLedgerEntry, 'id' | 'createdAt'>
  ): CustomerLedgerEntry => {
    const now = new Date().toISOString();
    const entryId = generateSecureId('LED');
    const newEntry: CustomerLedgerEntry = {
      ...entry,
      id: entryId,
      createdAt: now,
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedEntries = [newEntry, ...(c.ledgerEntries || [])];
          const updated = { ...c, ledgerEntries: updatedEntries, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          if (selectedCustomerForLedger?.id === customerId) {
            setSelectedCustomerForLedger(updated);
          }
          return updated;
        }
        return c;
      })
    );

    return newEntry;
  };

  const deleteCustomerLedgerEntry = (customerId: string, entryId: string) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedEntries = (c.ledgerEntries || []).filter((e) => e.id !== entryId);
          const updated = { ...c, ledgerEntries: updatedEntries, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          if (selectedCustomerForLedger?.id === customerId) {
            setSelectedCustomerForLedger(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const updateCustomerLedgerEntry = (
    customerId: string,
    entryId: string,
    updates: Partial<CustomerLedgerEntry>
  ) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedEntries = (c.ledgerEntries || []).map((entry) => {
            if (entry.id === entryId) {
              return { ...entry, ...updates };
            }
            return entry;
          });
          const updated = { ...c, ledgerEntries: updatedEntries, updatedAt: now };
          if (selectedCustomerForModal?.id === customerId) {
            setSelectedCustomerForModal(updated);
          }
          if (selectedCustomerForLedger?.id === customerId) {
            setSelectedCustomerForLedger(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const importCustomersBatch = (list: Array<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): number => {
    const now = new Date().toISOString();
    let addedCount = 0;

    setCustomers((prev) => {
      const updated = [...prev];
      const seenIds = new Set<string>(updated.map((c) => c.id));

      list.forEach((data) => {
        const cleanPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
        const cleanName = (data.name || '').trim().toLowerCase();

        // Check if matching customer exists by clean phone or exact name
        const existingIdx = updated.findIndex((c) => {
          if (cleanPhone && c.phone) {
            const existingCleanPhone = c.phone.replace(/\D/g, '');
            if (existingCleanPhone && existingCleanPhone === cleanPhone) return true;
          }
          if (cleanName && c.name && c.name.trim().toLowerCase() === cleanName && (!cleanPhone || !c.phone)) {
            return true;
          }
          return false;
        });

        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          const existingLedgerIds = new Set((existing.ledgerEntries || []).map((l) => l.id));
          const extraLedger = (data.ledgerEntries || []).filter((l) => !existingLedgerIds.has(l.id));

          updated[existingIdx] = {
            ...existing,
            name: data.name || existing.name,
            email: data.email || existing.email,
            address: data.address || existing.address,
            cnicOrGovId: data.cnicOrGovId || existing.cnicOrGovId,
            tags: Array.from(new Set([...(existing.tags || []), ...(data.tags || [])])),
            preferences: {
              preferredBrands: Array.from(new Set([...(existing.preferences?.preferredBrands || []), ...(data.preferences?.preferredBrands || [])])),
              whatsappAlerts: data.preferences?.whatsappAlerts ?? existing.preferences?.whatsappAlerts ?? true,
            },
            ledgerEntries: [...(existing.ledgerEntries || []), ...extraLedger],
            openingBalance: data.openingBalance || existing.openingBalance,
            updatedAt: now,
          };
        } else {
          // Generate collision-free unique ID
          let newId = '';
          let count = 0;
          do {
            newId = generateSecureId('CUST', updated);
            count++;
          } while (seenIds.has(newId) && count < 100);

          seenIds.add(newId);
          updated.unshift({
            ...data,
            id: newId,
            tags: data.tags?.length ? data.tags : ['New Customer'],
            preferences: data.preferences || { preferredBrands: [] },
            manualPurchases: data.manualPurchases || [],
            ledgerEntries: data.ledgerEntries || [],
            createdAt: now,
            updatedAt: now,
          });
          addedCount++;
        }
      });
      return updated;
    });

    return addedCount;
  };

  const recordSale = (saleInput: {
    deviceId: string;
    soldPrice: number;
    discount: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Split Payment' | 'Trade-In Balance';
    customer: CustomerInfo;
    warranty: WarrantyInfo;
    tradeInItem?: TradeInDevice;
    soldBy: string;
    notes?: string;
    paymentType?: 'full' | 'partial' | 'credit';
    amountPaidNow?: number;
    creditDueDate?: string;
    saleDate?: string;
  }): SaleRecord => {
    const device = inventory.find((item) => item.id === saleInput.deviceId);
    if (!device) {
      throw new Error('Device not found in stock');
    }

    const tradeInDeduction = saleInput.tradeInItem?.agreedValue || 0;
    const finalAmount = Math.max(0, saleInput.soldPrice - saleInput.discount - tradeInDeduction);
    const profit = saleInput.soldPrice - saleInput.discount - device.purchaseCost;
    
    const now = new Date();
    const effectiveSaleDate = saleInput.saleDate ? new Date(saleInput.saleDate).toISOString() : now.toISOString();
    const dateForInvoice = new Date(effectiveSaleDate);
    const invoiceNumber = `INV-${dateForInvoice.getFullYear()}${(dateForInvoice.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleId = `SALE-${Date.now().toString().slice(-5)}`;

    const saleRecord: SaleRecord = {
      saleId,
      invoiceNumber,
      deviceId: device.id,
      deviceType: device.deviceType,
      deviceTitle: `${device.brand} ${device.model} (${device.storage}${device.ram ? ` / ${device.ram}` : ''} - ${device.color})`,
      imei1: device.imei1,
      imei2: device.imei2,
      saleDate: effectiveSaleDate,
      purchaseCost: device.purchaseCost,
      soldPrice: saleInput.soldPrice,
      discount: saleInput.discount,
      finalAmount,
      profit,
      paymentMethod: saleInput.paymentMethod,
      customer: saleInput.customer,
      warranty: saleInput.warranty,
      tradeInItem: saleInput.tradeInItem,
      soldBy: saleInput.soldBy || settings.ownerName || 'Sales Staff',
      notes: saleInput.notes,
    };

    // Mark device as sold and attach record
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === device.id) {
          return {
            ...item,
            status: 'sold' as DeviceStatus,
            saleRecord,
            updatedAt: now.toISOString(),
          };
        }
        return item;
      })
    );

    // Sync / Auto-Register Customer into Customers Directory
    if (saleInput.customer.phone || saleInput.customer.name) {
      const existing = customers.find(
        (c) =>
          (c.phone && c.phone === saleInput.customer.phone) ||
          (c.name && c.name.toLowerCase() === saleInput.customer.name.toLowerCase())
      );

      // Check if there is unpaid credit balance to post to ledger
      const paidAmount = saleInput.paymentType === 'credit' 
        ? 0 
        : (saleInput.paymentType === 'partial' ? (saleInput.amountPaidNow || 0) : finalAmount);
      const unpaidBalance = Math.max(0, finalAmount - paidAmount);

      const mapPaymentMethod = (pm?: string): CustomerLedgerEntry['paymentMethod'] => {
        if (pm === 'Cash') return 'Cash';
        if (pm === 'Bank Transfer') return 'Bank Transfer';
        if (pm === 'Debit/Credit Card') return 'Card';
        if (pm === 'Trade-In Balance') return 'Trade-in';
        return 'Other';
      };

      const ledgerEntriesToAdd: CustomerLedgerEntry[] = [];
      if (unpaidBalance > 0) {
        ledgerEntriesToAdd.push({
          id: `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
          type: 'debit',
          transactionType: 'receivable_given',
          amount: unpaidBalance,
          date: effectiveSaleDate,
          description: `Sale on Credit: ${device.brand} ${device.model} (Invoice: ${invoiceNumber})`,
          paymentMethod: mapPaymentMethod(saleInput.paymentMethod),
          referenceInvoiceOrBill: invoiceNumber,
          dueDate: saleInput.creditDueDate,
          notes: paidAmount > 0 ? `Paid ${settings.currencySymbol}${paidAmount} now, remaining balance ${settings.currencySymbol}${unpaidBalance} on credit` : `100% sale on credit`,
          createdAt: now.toISOString(),
        });
      }

      if (existing) {
        // Update tags if repeat buyer
        const currentTags = existing.tags || [];
        const updatedTags = currentTags.includes('Repeat Buyer') ? currentTags : [...currentTags, 'Repeat Buyer'];
        if (saleInput.tradeInItem && !updatedTags.includes('Trade-in Regular')) {
          updatedTags.push('Trade-in Regular');
        }

        // Add brand to preferences if not present
        const currentBrands = existing.preferences?.preferredBrands || [];
        const updatedBrands = currentBrands.includes(device.brand) ? currentBrands : [...currentBrands, device.brand];

        const updatedEntries = [...ledgerEntriesToAdd, ...(existing.ledgerEntries || [])];

        updateCustomer(existing.id, {
          name: saleInput.customer.name || existing.name,
          fatherName: saleInput.customer.fatherName || existing.fatherName,
          email: saleInput.customer.email || existing.email,
          cnicOrGovId: saleInput.customer.cnicOrGovId || existing.cnicOrGovId,
          address: saleInput.customer.address || existing.address,
          tags: updatedTags,
          ledgerEntries: updatedEntries,
          preferences: {
            ...existing.preferences,
            preferredBrands: updatedBrands,
          }
        });
      } else {
        // Register new customer automatically
        const newCustTags = ['New Customer'];
        if (saleInput.tradeInItem) newCustTags.push('Trade-in Regular');
        if (saleInput.soldPrice > 1000) newCustTags.push('VIP Buyer');

        addCustomer({
          name: saleInput.customer.name,
          fatherName: saleInput.customer.fatherName,
          phone: saleInput.customer.phone,
          email: saleInput.customer.email,
          cnicOrGovId: saleInput.customer.cnicOrGovId,
          address: saleInput.customer.address,
          tags: newCustTags,
          preferences: {
            preferredBrands: [device.brand],
            conditionPreference: device.deviceType === 'new' ? 'New Only' : 'Both New & Used',
            storagePreference: device.storage,
            whatsappAlerts: true,
          },
          ledgerEntries: ledgerEntriesToAdd,
          manualPurchases: [],
        });
      }
    }

    // If trade-in item was provided, auto-add it to Used Inventory!
    if (saleInput.tradeInItem && saleInput.tradeInItem.imei) {
      const tradeIn = saleInput.tradeInItem;
      const tradeInMobile: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'> = {
        deviceType: 'used',
        brand: tradeIn.brand,
        model: tradeIn.model,
        storage: tradeIn.storage || '128GB',
        color: 'Standard / Customer Device',
        imei1: tradeIn.imei,
        conditionGrade: tradeIn.conditionGrade,
        batteryHealth: tradeIn.batteryHealth || 85,
        accessories: ['Device Only (Trade-in)'],
        networkStatus: 'PTA Approved',
        purchaseCost: tradeIn.agreedValue,
        sellingPriceTarget: Math.round(tradeIn.agreedValue * 1.25),
        minPrice: Math.round(tradeIn.agreedValue * 1.1),
        purchaseDate: now.toISOString(),
        supplierOrSeller: {
          name: saleInput.customer.name,
          phone: saleInput.customer.phone,
          cnicOrGovId: saleInput.customer.cnicOrGovId,
          address: saleInput.customer.address,
          type: 'Trade-in Exchange',
        },
        status: 'in_stock',
        notes: `Acquired via Trade-in against ${device.brand} ${device.model} (Invoice: ${invoiceNumber})`,
      };
      
      const newTradeInId = generateSecureId('MOB-TRD', inventory);
      setInventory((prev) => [
        {
          ...tradeInMobile,
          id: newTradeInId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        ...prev,
      ]);
    }

    setSales((prev) => [saleRecord, ...prev]);
    return saleRecord;
  };

  const updateSale = (saleId: string, updates: Partial<SaleRecord>) => {
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.saleId === saleId) {
          const updated = { ...sale, ...updates };
          if (selectedInvoiceForModal?.saleId === saleId) {
            setSelectedInvoiceForModal(updated);
          }
          return updated;
        }
        return sale;
      })
    );

    // Synchronize linked inventory device's saleRecord if exists
    setInventory((prev) =>
      prev.map((item) => {
        if (item.saleRecord && (item.saleRecord.saleId === saleId)) {
          return {
            ...item,
            saleRecord: {
              ...item.saleRecord,
              ...updates,
              customer: updates.customer ? { ...item.saleRecord.customer, ...updates.customer } : item.saleRecord.customer,
            },
          };
        }
        return item;
      })
    );
  };

  const recordUsedIntake = (data: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'>): MobileItem => {
    return addMobile({
      ...data,
      deviceType: 'used',
    });
  };

  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const exportDataJSON = () => {
    const dataObj = {
      exportDate: new Date().toISOString(),
      shop: settings,
      inventory,
      sales,
      customers,
      version: '1.1.0',
    };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile_shop_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.inventory || !Array.isArray(parsed.inventory)) {
        return { success: false, message: 'Invalid file: Missing inventory array.' };
      }
      const cleanInventory = sanitizeInventoryList(parsed.inventory);
      setInventory(cleanInventory);

      let cleanSalesCount = 0;
      if (parsed.sales && Array.isArray(parsed.sales)) {
        const cleanSales = sanitizeSalesList(parsed.sales);
        setSales(cleanSales);
        cleanSalesCount = cleanSales.length;
      }

      let cleanCustCount = 0;
      if (parsed.customers && Array.isArray(parsed.customers)) {
        const cleanCust = sanitizeCustomersList(parsed.customers);
        setCustomers(cleanCust);
        cleanCustCount = cleanCust.length;
      }

      if (parsed.shop) {
        setSettings(parsed.shop);
      }
      return { success: true, message: `Successfully restored ${cleanInventory.length} devices, ${cleanSalesCount} sales records, and ${cleanCustCount} customer profiles.` };
    } catch (e: any) {
      return { success: false, message: `Failed to parse backup JSON: ${e.message}` };
    }
  };

  const resetToSampleData = () => {
    // Preserve current data in Gmail vault snapshot first so reset can always be undone!
    const targetEmail = normalizeGmail(settings.backupGmail || 'mebadprince@gmail.com');
    const currentPayload = createBackupPayload(inventory, sales, customers, settings);
    saveGmailSnapshot(targetEmail, currentPayload, 'Pre-Reset Safety Snapshot');
    storeLocalEmergencySnapshot(currentPayload);

    setInventory(sanitizeInventoryList(sampleInventory));
    setSales(sanitizeSalesList(sampleSales));
    setCustomers(sanitizeCustomersList(sampleCustomers));
    setSettings(initialSettings);
  };

  const restoreFullBackup = (data: any): { success: boolean; message: string; counts?: { inventory: number; sales: number; customers: number } } => {
    try {
      const validation = validateBackupData(data);
      if (!validation.isValid) {
        return { success: false, message: validation.reason || 'Invalid backup structure.' };
      }

      const cleanInventory = sanitizeInventoryList(data.inventory);
      const cleanSales = sanitizeSalesList(data.sales);
      const cleanCustomers = sanitizeCustomersList(data.customers);
      const cleanSettings = data.settings ? { ...settings, ...data.settings } : settings;

      setInventory(cleanInventory);
      setSales(cleanSales);
      setCustomers(cleanCustomers);
      setSettings(cleanSettings);

      // Save to primary storage immediately
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(cleanInventory));
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(cleanSales));
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(cleanCustomers));
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cleanSettings));

      const payload = createBackupPayload(cleanInventory, cleanSales, cleanCustomers, cleanSettings);
      const targetEmail = normalizeGmail(cleanSettings.backupGmail || 'mebadprince@gmail.com');
      const meta = performAutoSave(targetEmail, payload, 'Restored from Backup');
      setLastAutoSaveTime(meta.lastSavedTime);
      setAutoSaveStatus(`Restored and auto-saved to Vault (${targetEmail})`);

      return {
        success: true,
        message: `Successfully restored ${cleanInventory.length} devices, ${cleanSales.length} invoices, and ${cleanCustomers.length} customers/Khata records for ${targetEmail}!`,
        counts: {
          inventory: cleanInventory.length,
          sales: cleanSales.length,
          customers: cleanCustomers.length,
        },
      };
    } catch (e: any) {
      return { success: false, message: `Failed to restore records: ${e.message}` };
    }
  };

  const restoreWithGmailId = async (
    gmailId: string,
    snapshotId?: string
  ): Promise<{ success: boolean; message: string; counts?: { inventory: number; sales: number; customers: number } }> => {
    try {
      setIsAutoSaving(true);
      const cleanEmail = normalizeGmail(gmailId || settings.backupGmail || 'mebadprince@gmail.com');

      // Create a safety snapshot of current data before restoring, so user never loses anything!
      const currentPayload = createBackupPayload(inventory, sales, customers, settings);
      saveGmailSnapshot(cleanEmail, currentPayload, 'Pre-Restore Safety Snapshot');
      storeLocalEmergencySnapshot(currentPayload);

      let targetData: any = null;

      // 1. If snapshotId is provided, check if it's a Drive file or local snapshot
      if (snapshotId && snapshotId.startsWith('SNAP-')) {
        const snapshots = await getGmailSnapshotsAsync(cleanEmail);
        const match = snapshots.find((s) => s.id === snapshotId);
        if (match && match.data) {
          targetData = match.data;
        }
      } else if (snapshotId) {
        // Try drive download
        try {
          const driveData = await downloadBackupFromDrive(snapshotId);
          if (driveData && validateBackupData(driveData).isValid) {
            targetData = driveData;
          }
        } catch (e) {
          console.warn('Drive download failed, will fallback to local vault', e);
        }
      }

      // 2. If not found yet, get latest Gmail snapshot from local vault (checking IndexedDB + memory)
      if (!targetData) {
        targetData = await getLatestGmailSnapshotAsync(cleanEmail);
      }

      // 3. If not found, check Permanent Vault
      if (!targetData) {
        targetData = await getPermanentVaultAsync();
      }

      // 4. If not found, check Emergency Snapshot
      if (!targetData) {
        targetData = getLocalEmergencySnapshot();
      }

      if (!targetData) {
        return {
          success: false,
          message: `No existing backup records found for Gmail ID "${cleanEmail}". A new cloud snapshot has been registered for this Gmail ID so your future records are automatically safe.`,
        };
      }

      return restoreFullBackup(targetData);
    } catch (err: any) {
      return { success: false, message: `Restore error: ${err.message}` };
    } finally {
      setIsAutoSaving(false);
    }
  };

  const restoreFromDriveFileId = async (fileId: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsAutoSaving(true);
      const driveData = await downloadBackupFromDrive(fileId);
      const res = restoreFullBackup(driveData);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: `Failed to download and restore from Google Drive: ${err.message}` };
    } finally {
      setIsAutoSaving(false);
    }
  };

  const triggerGmailCloudSync = async (
    customEmail?: string,
    reason: string = 'Manual Cloud Sync'
  ): Promise<{ success: boolean; message: string; driveUploaded?: boolean }> => {
    const targetEmail = normalizeGmail(customEmail || settings.backupGmail || 'mebadprince@gmail.com');
    const now = new Date().toISOString();
    const payload = createBackupPayload(inventory, sales, customers, {
      ...settings,
      backupGmail: targetEmail,
      lastBackupDate: now,
    });

    const meta = performAutoSave(targetEmail, payload, reason);
    setLastAutoSaveTime(meta.lastSavedTime);
    setSettings((prev) => ({ ...prev, backupGmail: targetEmail, lastBackupDate: now }));

    let driveUploaded = false;
    let driveMsg = '';

    try {
      const token = await getAccessToken();
      if (token) {
        await uploadBackupToDrive(payload);
        driveUploaded = true;
        driveMsg = ' & uploaded to your personal Google Drive';
      }
    } catch (err: any) {
      console.warn('Google Drive cloud upload skipped or unauthenticated:', err);
    }

    return {
      success: true,
      message: `All ${inventory.length} devices, ${sales.length} invoices, and ${customers.length} customer records saved securely for ${targetEmail}${driveMsg}.`,
      driveUploaded,
    };
  };

  const getAvailableGmailBackups = async (gmailId?: string) => {
    const cleanEmail = normalizeGmail(gmailId || settings.backupGmail || 'mebadprince@gmail.com');
    const results: Array<{
      id: string;
      name: string;
      timestamp: string;
      dateFormatted: string;
      source: 'drive' | 'local_vault';
      inventoryCount: number;
      salesCount: number;
      customersCount: number;
      reason?: string;
      data?: any;
    }> = [];

    // 1. Fetch local vault snapshots for this Gmail ID (IndexedDB + Memory + LocalStorage)
    const localSnapshots = await getGmailSnapshotsAsync(cleanEmail);
    for (const snap of localSnapshots) {
      results.push({
        id: snap.id,
        name: `Vault Snapshot (${snap.reason || 'Auto-Save'})`,
        timestamp: snap.timestamp,
        dateFormatted: snap.dateFormatted || new Date(snap.timestamp).toLocaleString(),
        source: 'local_vault',
        inventoryCount: snap.inventoryCount,
        salesCount: snap.salesCount,
        customersCount: snap.customersCount,
        reason: snap.reason,
        data: snap.data,
      });
    }

    // 2. Fetch Google Drive backups if user is authenticated with Google
    try {
      const token = await getAccessToken();
      if (token) {
        const driveFiles = await listDriveBackups();
        for (const file of driveFiles) {
          results.push({
            id: file.id,
            name: file.name,
            timestamp: file.createdTime,
            dateFormatted: new Date(file.createdTime).toLocaleString(),
            source: 'drive',
            inventoryCount: 0,
            salesCount: 0,
            customersCount: 0,
            reason: file.description || 'Google Drive Cloud File',
          });
        }
      }
    } catch {
      // ignore
    }

    return results;
  };

  const exportAllToPDF = (generatedBy?: string) => {
    exportCompleteShopPDF(
      inventory,
      sales,
      settings,
      customers,
      generatedBy || settings.ownerName || 'Admin'
    );
    const now = new Date().toISOString();
    setSettings((prev) => ({ ...prev, lastBackupDate: now }));
  };

  const exportAllToSheets = () => {
    exportCompleteShopWorkbook(inventory, sales, settings, customers);
    const now = new Date().toISOString();
    setSettings((prev) => ({ ...prev, lastBackupDate: now }));
  };

  const exportInventoryToSheets = (format: 'xlsx' | 'csv' = 'xlsx') => {
    exportInventorySheet(inventory, format);
  };

  const exportSalesToSheets = (format: 'xlsx' | 'csv' = 'xlsx') => {
    exportSalesSheet(sales, format);
  };

  const exportCustomersToSheets = (format: 'xlsx' | 'csv' = 'xlsx') => {
    exportCustomersSheet(customers, sales, format);
  };

  const triggerGmailBackup = (customEmail?: string) => {
    const targetEmail = customEmail || settings.backupGmail || settings.email || 'mebadprince@gmail.com';
    const draft = generateGmailBackupDraft(targetEmail, inventory, sales, settings);
    const now = new Date().toISOString();
    setSettings((prev) => ({
      ...prev,
      backupGmail: targetEmail,
      lastBackupDate: now,
    }));
    return draft;
  };

  const forceSyncNow = async () => {
    setCloudSyncStatus('syncing');
    try {
      // 1. Pull latest entries from Firebase / Cloud first so phone entries are never lost
      const res = await pullStoreFromCloud();
      let combined = { inventory, sales, customers, settings };
      if (res.success && res.data) {
        isUpdatingFromCloud.current = true;
        const cloudData = res.data;
        combined = mergeStoreDatasets({ inventory, sales, customers, settings }, cloudData);
        setInventory(sanitizeInventoryList(combined.inventory));
        setSales(sanitizeSalesList(combined.sales));
        setCustomers(sanitizeCustomersList(combined.customers));
        if (combined.settings) {
          setSettings(combined.settings);
        }
        setLastCloudSyncTime(new Date().toLocaleTimeString());
        setTimeout(() => {
          isUpdatingFromCloud.current = false;
        }, 500);
      }
      // 2. Now push the combined state so both phone and system have identical data
      await pushStoreToCloud(combined);
      setCloudSyncStatus('synced');
      setSyncNotification('All records fully synchronized across phone and system');
    } catch (err) {
      console.error('Manual sync failed:', err);
      setCloudSyncStatus('error');
    }
  };

  const clearSyncNotification = () => setSyncNotification(null);

  return (
    <ShopContext.Provider
      value={{
        inventory,
        sales,
        customers,
        settings,
        activeTab,
        setActiveTab,
        lastAutoSaveTime,
        isAutoSaving,
        autoSaveStatus,
        restoreWithGmailId,
        restoreFullBackup,
        triggerGmailCloudSync,
        getAvailableGmailBackups,
        addMobile,
        updateMobile,
        deleteMobile,
        updateMobileStatus,
        getMobileById,
        getDeviceByImei,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        getCustomerByPhone,
        addManualPurchaseToCustomer,
        updateManualPurchase,
        deleteManualPurchase,
        addCustomerLedgerEntry,
        updateCustomerLedgerEntry,
        deleteCustomerLedgerEntry,
        importCustomersBatch,
        recordSale,
        updateSale,
        recordUsedIntake,
        updateSettings,
        formatCurrency,
        exportDataJSON,
        importDataJSON,
        resetToSampleData,
        exportAllToPDF,
        exportAllToSheets,
        exportInventoryToSheets,
        exportSalesToSheets,
        exportCustomersToSheets,
        triggerGmailBackup,
        selectedDeviceForModal,
        setSelectedDeviceForModal,
        selectedInvoiceForModal,
        setSelectedInvoiceForModal,
        selectedPoliceCertDevice,
        setSelectedPoliceCertDevice,
        selectedCustomerForModal,
        setSelectedCustomerForModal,
        customerToEdit,
        setCustomerToEdit,
        deviceToEdit,
        setDeviceToEdit,
        ledgerEntryToEdit,
        setLedgerEntryToEdit,
        isAddModalOpen,
        setIsAddModalOpen,
        isAddCustomerModalOpen,
        setIsAddCustomerModalOpen,
        isContactImportModalOpen,
        setIsContactImportModalOpen,
        isAddLedgerModalOpen,
        setIsAddLedgerModalOpen,
        selectedCustomerForLedger,
        setSelectedCustomerForLedger,
        ledgerInitialType,
        setLedgerInitialType,
        isImeiSearchOpen,
        setIsImeiSearchOpen,
        isPosModalOpen,
        setIsPosModalOpen,
        selectedDeviceForSale,
        setSelectedDeviceForSale,
        selectedCustomerForSale,
        setSelectedCustomerForSale,
        isBackupModalOpen,
        setIsBackupModalOpen,
        isInstallModalOpen,
        setIsInstallModalOpen,
        isVoiceAssistantOpen,
        setIsVoiceAssistantOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        cloudSyncStatus,
        lastCloudSyncTime,
        forceSyncNow,
        syncNotification,
        clearSyncNotification,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

