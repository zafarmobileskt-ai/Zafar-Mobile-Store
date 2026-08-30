import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface ShopContextType {
  inventory: MobileItem[];
  sales: SaleRecord[];
  customers: Customer[];
  settings: ShopSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
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
  deleteManualPurchase: (customerId: string, purchaseId: string) => void;
  addCustomerLedgerEntry: (customerId: string, entry: Omit<CustomerLedgerEntry, 'id' | 'createdAt'>) => CustomerLedgerEntry;
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
  }) => SaleRecord;
  
  // Buy Used Phone & Trade-in Operations
  recordUsedIntake: (data: Omit<MobileItem, 'id' | 'createdAt' | 'updatedAt'>) => MobileItem;
  
  // Settings & Utilities
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  formatCurrency: (amount: number) => string;
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => { success: boolean; message: string };
  resetToSampleData: () => void;
  
  // Spreadsheet & Backup Exports
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
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const INVENTORY_STORAGE_KEY = 'zafar_mobile_inventory_v1';
const SALES_STORAGE_KEY = 'zafar_mobile_sales_v1';
const CUSTOMERS_STORAGE_KEY = 'zafar_mobile_customers_v1';
const SETTINGS_STORAGE_KEY = 'zafar_mobile_settings_v1';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<MobileItem[]>(() => {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY) || localStorage.getItem('apex_mobile_inventory_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading inventory from localStorage', e);
    }
    return sampleInventory;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SALES_STORAGE_KEY) || localStorage.getItem('apex_mobile_sales_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading sales from localStorage', e);
    }
    return sampleSales;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading customers from localStorage', e);
    }
    return sampleCustomers;
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem('apex_mobile_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName === 'Apex Mobile Zone & Tech Hub') {
          parsed.shopName = 'ZAFAR MOBILE STORE';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed reading settings from localStorage', e);
    }
    return initialSettings;
  });

  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  // Modal states
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState<MobileItem | null>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<SaleRecord | null>(null);
  const [selectedPoliceCertDevice, setSelectedPoliceCertDevice] = useState<MobileItem | null>(null);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [isContactImportModalOpen, setIsContactImportModalOpen] = useState<boolean>(false);
  const [isAddLedgerModalOpen, setIsAddLedgerModalOpen] = useState<boolean>(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [ledgerInitialType, setLedgerInitialType] = useState<'debit' | 'credit'>('debit');
  const [isImeiSearchOpen, setIsImeiSearchOpen] = useState<boolean>(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState<boolean>(false);
  const [selectedDeviceForSale, setSelectedDeviceForSale] = useState<MobileItem | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const formatCurrency = (amount: number): string => {
    const symbol = settings.currencySymbol || '$';
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
    const newId = `MOB-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
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
    const newId = `CUST-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    const newCustomer: Customer = {
      ...data,
      id: newId,
      tags: data.tags?.length ? data.tags : ['New Customer'],
      preferences: data.preferences || { preferredBrands: [] },
      manualPurchases: data.manualPurchases || [],
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
    const purchaseId = `MP-${Date.now().toString().slice(-4)}`;
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

  const addCustomerLedgerEntry = (
    customerId: string,
    entry: Omit<CustomerLedgerEntry, 'id' | 'createdAt'>
  ): CustomerLedgerEntry => {
    const now = new Date().toISOString();
    const entryId = `LED-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
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

  const importCustomersBatch = (list: Array<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): number => {
    const now = new Date().toISOString();
    let addedCount = 0;

    setCustomers((prev) => {
      const updated = [...prev];
      list.forEach((data) => {
        const cleanPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
        const existingIdx = cleanPhone ? updated.findIndex((c) => c.phone.replace(/\D/g, '') === cleanPhone) : -1;

        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            name: data.name || existing.name,
            email: data.email || existing.email,
            address: data.address || existing.address,
            openingBalance: data.openingBalance || existing.openingBalance,
            updatedAt: now,
          };
        } else {
          const newId = `CUST-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
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
  }): SaleRecord => {
    const device = inventory.find((item) => item.id === saleInput.deviceId);
    if (!device) {
      throw new Error('Device not found in stock');
    }

    const tradeInDeduction = saleInput.tradeInItem?.agreedValue || 0;
    const finalAmount = Math.max(0, saleInput.soldPrice - saleInput.discount - tradeInDeduction);
    const profit = saleInput.soldPrice - saleInput.discount - device.purchaseCost;
    
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleId = `SALE-${Date.now().toString().slice(-5)}`;

    const saleRecord: SaleRecord = {
      saleId,
      invoiceNumber,
      deviceId: device.id,
      deviceType: device.deviceType,
      deviceTitle: `${device.brand} ${device.model} (${device.storage}${device.ram ? ` / ${device.ram}` : ''} - ${device.color})`,
      imei1: device.imei1,
      imei2: device.imei2,
      saleDate: now.toISOString(),
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
          date: now.toISOString(),
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
      
      const newTradeInId = `MOB-TRD-${Date.now().toString().slice(-4)}`;
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
      setInventory(parsed.inventory);
      if (parsed.sales && Array.isArray(parsed.sales)) {
        setSales(parsed.sales);
      }
      if (parsed.customers && Array.isArray(parsed.customers)) {
        setCustomers(parsed.customers);
      }
      if (parsed.shop) {
        setSettings(parsed.shop);
      }
      return { success: true, message: `Successfully restored ${parsed.inventory.length} devices, ${parsed.sales?.length || 0} sales records, and ${parsed.customers?.length || 0} customer profiles.` };
    } catch (e: any) {
      return { success: false, message: `Failed to parse backup JSON: ${e.message}` };
    }
  };

  const resetToSampleData = () => {
    setInventory(sampleInventory);
    setSales(sampleSales);
    setCustomers(sampleCustomers);
    setSettings(initialSettings);
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

  return (
    <ShopContext.Provider
      value={{
        inventory,
        sales,
        customers,
        settings,
        activeTab,
        setActiveTab,
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
        deleteManualPurchase,
        addCustomerLedgerEntry,
        deleteCustomerLedgerEntry,
        importCustomersBatch,
        recordSale,
        recordUsedIntake,
        updateSettings,
        formatCurrency,
        exportDataJSON,
        importDataJSON,
        resetToSampleData,
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
        isBackupModalOpen,
        setIsBackupModalOpen,
        isInstallModalOpen,
        setIsInstallModalOpen,
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

