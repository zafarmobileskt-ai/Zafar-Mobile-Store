export type DeviceType = 'new' | 'used';

export type ConditionGrade = 
  | 'Brand New (Box Pack)'
  | 'Open Box (10/10)'
  | 'Grade A+ (Flawless)'
  | 'Grade A (Minor Wear)'
  | 'Grade B (Noticeable Scratches)'
  | 'Grade C (Heavy Scratches / Dents)'
  | 'Refurbished'
  | 'Faulty / Parts Only';

export type DeviceStatus = 'in_stock' | 'sold' | 'reserved' | 'under_repair' | 'returned';

export type NetworkStatus = 
  | 'Factory Unlocked (Global)'
  | 'PTA Approved'
  | 'Non-PTA / JV'
  | 'Carrier Locked'
  | 'Dual SIM / eSIM Active';

export type ScreenCondition = 
  | 'Original Pristine'
  | 'Original Minor Scratches'
  | 'Replaced High Copy / OLED'
  | 'Replaced Original Pull'
  | 'Cracked Glass / Working Display'
  | 'Lines / Dot on Screen';

export interface DiagnosticChecklist {
  touchScreen: boolean;
  faceIdOrFingerprint: boolean;
  frontCamera: boolean;
  backCamera: boolean;
  chargingPort: boolean;
  speakersAndMic: boolean;
  wifiAndBluetooth: boolean;
  simAndNetworkCalling: boolean;
  physicalButtons: boolean;
  wirelessCharging?: boolean;
  trueTone?: boolean;
}

export interface PoliceVerificationData {
  verificationStatus: 'verified' | 'pending' | 'exempt';
  policeRecordCheck?: boolean; // Checked against stolen database / local police portal
  idCardFrontUploaded?: boolean;
  idCardNumber?: string; // CNIC / Driver License / National ID
  sellerThumbprintCaptured?: boolean;
  sellerFatherName?: string;
  sellerCityAddress?: string;
  originalPurchaseReceiptAttached?: boolean;
  policeStationJurisdiction?: string; // e.g. "Civil Lines Station", "Central District Precinct"
  affidavitSigned?: boolean; // "I confirm under penalty of law this mobile is my legitimate property..."
  verifiedByOfficerOrStaff?: string;
  verificationDate?: string;
  notes?: string;
}

export interface SellerSupplierInfo {
  name: string;
  phone: string;
  cnicOrGovId?: string;
  fatherName?: string;
  address?: string;
  type: 'Distributor' | 'Walk-in Customer' | 'Trade-in Exchange' | 'Other Shop' | 'Online Marketplace';
}

export interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  cnicOrGovId?: string;
  email?: string;
  address?: string;
}

export interface CustomerPreferences {
  preferredBrands: string[]; // e.g. ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus']
  budgetRange?: string; // e.g. '$300 - $600', '$1000+', 'Mid-Range', 'Flagship'
  storagePreference?: string; // e.g. '128GB', '256GB+', '512GB'
  conditionPreference?: 'New Only' | 'Certified Used / Pre-Owned' | 'Both New & Used';
  interestedCategories?: string[]; // e.g. ['Flagship Phones', 'Budget Daily Driver', 'Smartwatches & Buds', 'Gaming Phones', 'Original Accessories']
  notes?: string; // Specific preferences notes, e.g. "Looking for iPhone 15 Pro Natural Titanium 256GB PTA Approved", "Prefers 90%+ battery health"
  whatsappAlerts?: boolean;
}

export interface ManualPurchaseLog {
  id: string;
  itemTitle: string; // e.g. "AirPods Pro 2", "Anker 65W Fast Charger", "Original Screen Replacement"
  category: 'Phone' | 'Accessory' | 'Repair / Screen' | 'Audio / Buds' | 'Other';
  amount: number;
  date: string; // ISO string
  imeiOrSerial?: string;
  notes?: string;
}

export type LedgerEntryType = 'debit' | 'credit'; 
// 'debit' = You Gave / Receivable from customer (Customer owes money to shop)
// 'credit' = You Received / Payable to customer (Customer paid money OR shop owes customer advance/balance)

export type LedgerTransactionType = 
  | 'receivable_given'   // Shop gave credit / sale on credit / loan (Debit -> Customer owes shop)
  | 'payment_received'   // Customer paid money (Credit -> Reduces customer debt)
  | 'payable_owed'       // Shop owes customer (Credit -> Shop has payable debt e.g. trade-in / advance)
  | 'payment_paid'       // Shop paid money to customer (Debit -> Reduces shop debt)
  | 'opening_balance'    // Initial opening balance
  | 'discount_waiver'    // Shop waived / discounted pending debt
  | 'other';

export interface CustomerLedgerEntry {
  id: string;
  type: LedgerEntryType; // 'debit' or 'credit'
  transactionType: LedgerTransactionType;
  amount: number;
  date: string; // ISO date string
  description: string; // e.g. "iPhone 15 Pro unpaid balance", "Cash payment received", "Opening balance"
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'JazzCash / Easypaisa' | 'Card' | 'Check' | 'Trade-in' | 'Other';
  referenceInvoiceOrBill?: string; // e.g. INV-202608-1002
  dueDate?: string; // Due date for payment if receivable
  notes?: string;
  createdAt: string;
}

export interface CustomerOpeningBalance {
  amount: number;
  type: 'receivable' | 'payable' | 'none';
  date?: string;
  dueDate?: string;
  notes?: string;
}

export interface CustomerLedgerSummary {
  totalDebit: number; // money given / charged to customer
  totalCredit: number; // money received / paid by customer
  netBalance: number; // totalDebit - totalCredit
  balanceType: 'receivable' | 'payable' | 'settled'; // >0: receivable (Customer owes shop), <0: payable (Shop owes customer), ==0: settled
  pendingReceivable: number; // If balanceType === 'receivable', positive amount
  pendingPayable: number; // If balanceType === 'payable', positive amount
  overdueCount: number;
  lastTransactionDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cnicOrGovId?: string;
  address?: string;
  tags: string[]; // ['VIP Buyer', 'Trade-in Regular', 'Dealer / Wholesale', 'Repeat Buyer', 'New Customer']
  preferences: CustomerPreferences;
  openingBalance?: CustomerOpeningBalance;
  ledgerEntries?: CustomerLedgerEntry[];
  manualPurchases?: ManualPurchaseLog[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyInfo {
  type: 'Shop Checking Warranty' | 'Official Brand Warranty' | 'No Warranty' | 'Extended Dealer Warranty';
  durationDays: number;
  warrantyExpiry: string;
  terms: string;
}

export interface TradeInDevice {
  brand: string;
  model: string;
  storage?: string;
  imei: string;
  conditionGrade: ConditionGrade;
  agreedValue: number;
  batteryHealth?: number;
}

export interface SaleRecord {
  saleId: string;
  invoiceNumber: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceTitle: string; // e.g. "Apple iPhone 15 Pro (256GB - Natural Titanium)"
  imei1: string;
  imei2?: string;
  saleDate: string; // ISO string
  purchaseCost: number;
  soldPrice: number;
  discount: number;
  finalAmount: number; // soldPrice - discount - (tradeInValue || 0)
  profit: number; // (soldPrice - discount) - purchaseCost
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Split Payment' | 'Trade-In Balance';
  customer: CustomerInfo;
  warranty: WarrantyInfo;
  tradeInItem?: TradeInDevice;
  soldBy: string;
  notes?: string;
}

export interface MobileItem {
  id: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  color: string;
  storage: string;
  ram?: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  
  // Specific to Used Phones & Anti-Theft / Police Protection Compliance
  conditionGrade?: ConditionGrade;
  batteryHealth?: number; // percentage, e.g., 88
  screenCondition?: ScreenCondition;
  diagnostics?: DiagnosticChecklist;
  policeProtection?: PoliceVerificationData;
  
  // Accessories & Network
  accessories: string[]; // ['Original Box', 'Charger', 'Cable', 'Case', 'Original Bill']
  networkStatus: NetworkStatus;
  
  // Financials
  purchaseCost: number;
  sellingPriceTarget: number;
  minPrice: number;
  purchaseDate: string; // ISO string
  supplierOrSeller: SellerSupplierInfo;
  
  // Status & Lifecycle
  status: DeviceStatus;
  saleRecord?: SaleRecord;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  ownerName: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  currency: string;
  currencySymbol: string;
  defaultWarrantyDaysNew: number;
  defaultWarrantyDaysUsed: number;
  defaultInvoiceTerms: string;
  requireSellerId: boolean;
  backupGmail?: string;
  lastBackupDate?: string;
}
