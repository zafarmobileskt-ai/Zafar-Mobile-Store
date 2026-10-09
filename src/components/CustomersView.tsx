import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Tag, 
  Sliders, 
  ShoppingBag, 
  Sparkles, 
  ChevronRight, 
  Download, 
  FileSpreadsheet, 
  Smartphone, 
  MessageSquare, 
  ShieldCheck, 
  ArrowUpDown,
  ExternalLink,
  Layers,
  CheckCircle2,
  Trash2,
  Edit3,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  AlertTriangle,
  Upload,
  Clock,
  LayoutGrid,
  List,
  RotateCcw,
  Check,
  Hash,
  Calendar,
  Plus
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, SaleRecord, ManualPurchaseLog } from '../types/mobile';
import { computeCustomerLedger, formatLedgerStatus, generateWhatsAppDebtReminder } from '../utils/ledgerUtils';

interface CustomerStat {
  totalSpend: number;
  invoiceCount: number;
  manualCount: number;
  matchedPhones: number;
}

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    sales, 
    inventory, 
    formatCurrency, 
    setSelectedCustomerForModal, 
    setIsAddCustomerModalOpen,
    setIsContactImportModalOpen,
    setIsAddLedgerModalOpen,
    setSelectedCustomerForLedger,
    setLedgerInitialType,
    setCustomerToEdit,
    exportCustomersToSheets,
    deleteCustomer,
    settings,
    setSelectedCustomerForSale,
    setIsPosModalOpen,
    setSelectedInvoiceForModal
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'receivable' | 'payable' | 'overdue' | 'settled'>('all');
  const [phoneHistoryFilter, setPhoneHistoryFilter] = useState<'all' | 'has_phones' | 'multi_phones' | 'no_phones'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'phones' | 'spend' | 'receivable' | 'name' | 'invoices'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Derive all unique tags from customer database
  const allTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      (c.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [customers]);

  // Derive all unique preferred brands
  const allPreferredBrands = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      (c.preferences?.preferredBrands || []).forEach((b) => set.add(b));
    });
    return Array.from(set);
  }, [customers]);

  // Compute stats and ledger calculations map for every customer
  const customerMetaMap = useMemo(() => {
    const map = new Map<string, { 
      stats: CustomerStat; 
      ledger: ReturnType<typeof computeCustomerLedger>;
      linkedSales: SaleRecord[];
      manualPhones: ManualPurchaseLog[];
      totalPhonesCount: number;
    }>();
    
    customers.forEach((cust) => {
      const cleanCustPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
      const cleanName = cust.name ? cust.name.trim().toLowerCase() : '';
      const cleanCnic = cust.cnicOrGovId ? cust.cnicOrGovId.trim().toLowerCase() : '';

      const salesMap = new Map<string, SaleRecord>();
      const isMatch = (c?: { id?: string; phone?: string; name?: string; cnicOrGovId?: string }) => {
        if (!c) return false;
        if (c.id && cust.id && c.id === cust.id) return true;
        if (cleanCustPhone && c.phone && c.phone.replace(/\D/g, '') === cleanCustPhone) return true;
        if (cleanName && c.name && c.name.trim().toLowerCase() === cleanName) return true;
        if (cleanCnic && c.cnicOrGovId && c.cnicOrGovId.trim().toLowerCase() === cleanCnic) return true;
        return false;
      };

      sales.forEach((s) => {
        if (isMatch(s.customer)) {
          salesMap.set(s.saleId, s);
        }
      });

      inventory.forEach((item) => {
        if (item.status === 'sold' && item.saleRecord) {
          if (isMatch(item.saleRecord.customer)) {
            salesMap.set(item.saleRecord.saleId, item.saleRecord);
          }
        }
      });

      const linkedSales = Array.from(salesMap.values());

      const manualPurchases = cust.manualPurchases || [];
      const manualPhones = manualPurchases.filter(m => m.category === 'Phone');
      const totalPhonesCount = linkedSales.length + manualPhones.length;

      const totalInvoiced = linkedSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
      const manualSpend = manualPurchases.reduce((acc, m) => acc + (m.amount || 0), 0);
      
      const prefBrands = cust.preferences?.preferredBrands || [];
      const matched = inventory.filter((item) => {
        if (item.status !== 'in_stock') return false;
        if (prefBrands.length > 0 && !prefBrands.includes(item.brand)) return false;
        return true;
      }).length;

      const ledger = computeCustomerLedger(cust);

      map.set(cust.id, {
        stats: {
          totalSpend: totalInvoiced + manualSpend,
          invoiceCount: linkedSales.length,
          manualCount: manualPurchases.length,
          matchedPhones: matched,
        },
        ledger,
        linkedSales,
        manualPhones,
        totalPhonesCount,
      });
    });

    return map;
  }, [customers, sales, inventory]);

  // Global Metrics
  const globalMetrics = useMemo(() => {
    let totalReceivables = 0;
    let totalPayables = 0;
    let receivableCount = 0;
    let payableCount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let customersWithPhonesCount = 0;
    let totalPhonesPurchasedAll = 0;

    customers.forEach((c) => {
      const data = customerMetaMap.get(c.id);
      if (!data) return;
      const { ledger, totalPhonesCount } = data;

      if (totalPhonesCount > 0) {
        customersWithPhonesCount++;
        totalPhonesPurchasedAll += totalPhonesCount;
      }

      if (ledger.balanceType === 'receivable') {
        totalReceivables += ledger.pendingReceivable;
        receivableCount++;
      } else if (ledger.balanceType === 'payable') {
        totalPayables += ledger.pendingPayable;
        payableCount++;
      }

      if (ledger.overdueCount > 0) {
        overdueCount += ledger.overdueCount;
        overdueAmount += ledger.overdueAmount;
      }
    });

    return {
      totalReceivables,
      totalPayables,
      receivableCount,
      payableCount,
      overdueCount,
      overdueAmount,
      customersWithPhonesCount,
      totalPhonesPurchasedAll,
    };
  }, [customers, customerMetaMap]);

  // Total Lifetime Customer Revenue
  const totalLifetimeCustomerRevenue = useMemo(() => {
    let sum = 0;
    customerMetaMap.forEach((meta) => {
      sum += meta.stats?.totalSpend || 0;
    });
    return sum;
  }, [customerMetaMap]);

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    const seenIds = new Set<string>();

    return customers
      .filter((cust) => {
        if (!cust || !cust.id || seenIds.has(cust.id)) return false;
        seenIds.add(cust.id);

        const meta = customerMetaMap.get(cust.id);
        const ledger = meta?.ledger;

        // Balance Filter
        if (balanceFilter === 'receivable') {
          if (ledger?.balanceType !== 'receivable') return false;
        } else if (balanceFilter === 'payable') {
          if (ledger?.balanceType !== 'payable') return false;
        } else if (balanceFilter === 'overdue') {
          if (!ledger || ledger.overdueCount === 0) return false;
        } else if (balanceFilter === 'settled') {
          if (ledger?.balanceType !== 'settled') return false;
        }

        // Phone History Filter
        if (phoneHistoryFilter === 'has_phones') {
          if ((meta?.totalPhonesCount || 0) === 0) return false;
        } else if (phoneHistoryFilter === 'multi_phones') {
          if ((meta?.totalPhonesCount || 0) < 2) return false;
        } else if (phoneHistoryFilter === 'no_phones') {
          if ((meta?.totalPhonesCount || 0) > 0) return false;
        }

        // Search matching: name, phone, email, cnic, purchased phone titles, IMEIs, invoice numbers, brands, notes
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanQ = q.replace(/\D/g, '');
          const matchesName = cust.name.toLowerCase().includes(q);
          const matchesPhone = cust.phone.toLowerCase().includes(q) || (cleanQ.length >= 4 && cust.phone.replace(/\D/g, '').includes(cleanQ));
          const matchesEmail = cust.email ? cust.email.toLowerCase().includes(q) : false;
          const matchesId = cust.cnicOrGovId ? cust.cnicOrGovId.toLowerCase().includes(q) : false;
          const matchesBrands = (cust.preferences?.preferredBrands || []).some((b) => b.toLowerCase().includes(q));
          const matchesNotes = cust.preferences?.notes ? cust.preferences.notes.toLowerCase().includes(q) : false;

          // Search in purchased phones
          const matchesPurchasedPhones = (meta?.linkedSales || []).some((s) => 
            s.deviceTitle.toLowerCase().includes(q) ||
            s.imei1.toLowerCase().includes(q) ||
            (s.imei2 && s.imei2.toLowerCase().includes(q)) ||
            s.invoiceNumber.toLowerCase().includes(q)
          );
          const matchesManualPhones = (meta?.manualPhones || []).some((m) =>
            m.itemTitle.toLowerCase().includes(q) ||
            (m.imeiOrSerial && m.imeiOrSerial.toLowerCase().includes(q))
          );

          if (!matchesName && !matchesPhone && !matchesEmail && !matchesId && !matchesBrands && !matchesNotes && !matchesPurchasedPhones && !matchesManualPhones) {
            return false;
          }
        }

        // Tag filter
        if (selectedTagFilter !== 'all') {
          if (!cust.tags || !cust.tags.includes(selectedTagFilter)) {
            return false;
          }
        }

        // Brand filter
        if (selectedBrandFilter !== 'all') {
          if (!cust.preferences?.preferredBrands || !cust.preferences.preferredBrands.includes(selectedBrandFilter)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const metaA = customerMetaMap.get(a.id);
        const metaB = customerMetaMap.get(b.id);
        const statsA = metaA?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
        const statsB = metaB?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
        const ledgerA = metaA?.ledger;
        const ledgerB = metaB?.ledger;
        const phonesA = metaA?.totalPhonesCount || 0;
        const phonesB = metaB?.totalPhonesCount || 0;

        if (sortBy === 'phones') {
          return phonesB - phonesA;
        }
        if (sortBy === 'receivable') {
          const recA = ledgerA?.balanceType === 'receivable' ? ledgerA.pendingReceivable : 0;
          const recB = ledgerB?.balanceType === 'receivable' ? ledgerB.pendingReceivable : 0;
          return recB - recA;
        }
        if (sortBy === 'spend') {
          return statsB.totalSpend - statsA.totalSpend;
        }
        if (sortBy === 'invoices') {
          return (statsB.invoiceCount + statsB.manualCount) - (statsA.invoiceCount + statsA.manualCount);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // 'recent'
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [customers, searchQuery, balanceFilter, phoneHistoryFilter, selectedTagFilter, selectedBrandFilter, sortBy, customerMetaMap]);

  const handleOpenLedgerForCustomer = (customer: Customer, type: 'debit' | 'credit') => {
    setSelectedCustomerForLedger(customer);
    setLedgerInitialType(type);
    setIsAddLedgerModalOpen(true);
  };

  const handleQuickSellToCustomer = (customer: Customer) => {
    setSelectedCustomerForSale(customer);
    setIsPosModalOpen(true);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setBalanceFilter('all');
    setPhoneHistoryFilter('all');
    setSelectedTagFilter('all');
    setSelectedBrandFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery || balanceFilter !== 'all' || phoneHistoryFilter !== 'all' || selectedTagFilter !== 'all' || selectedBrandFilter !== 'all' || sortBy !== 'recent';

  return (
    <div id="customers-management-view" className="space-y-6">
      
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Customer Management System
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {customers.length} Profiles
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track customer profiles, phone purchase histories, IMEIs, contact details & Khata credit ledgers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {/* Contact Access & Import Button */}
          <button
            id="import-phone-contacts-btn"
            onClick={() => setIsContactImportModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Import phone contacts from device address book or vCard .vcf"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Quick Khata Entry */}
          <button
            id="quick-khata-entry-btn"
            onClick={() => {
              setSelectedCustomerForLedger(null);
              setLedgerInitialType('debit');
              setIsAddLedgerModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">+ Khata</span>
          </button>

          {/* Export Customers to Excel */}
          <button
            id="export-customers-sheet-btn"
            onClick={() => exportCustomersToSheets('xlsx')}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Export all customers to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Add Customer Button */}
          <button
            id="add-new-customer-btn"
            onClick={() => {
              setCustomerToEdit(null);
              setIsAddCustomerModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner - Highlighting Khata & Phone History */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Customers */}
        <div 
          onClick={() => resetAllFilters()}
          className="p-4 rounded-2xl border bg-white border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Lifetime spend: <span className="font-semibold text-slate-800">{formatCurrency(totalLifetimeCustomerRevenue)}</span>
          </div>
        </div>

        {/* Active Phone Buyers */}
        <div 
          onClick={() => setPhoneHistoryFilter('has_phones')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            phoneHistoryFilter === 'has_phones'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="text-emerald-800">Phone Buyers</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {globalMetrics.customersWithPhonesCount}
          </div>
          <div className="text-[11px] text-emerald-800/80 font-medium mt-1">
            <b>{globalMetrics.totalPhonesPurchasedAll}</b> total mobile phones sold
          </div>
        </div>

        {/* Total Receivables (Lene Hain) */}
        <div 
          onClick={() => setBalanceFilter('receivable')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            balanceFilter === 'receivable' 
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400' 
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="text-amber-800">Receivables (Lene Hain)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{formatCurrency(globalMetrics.totalReceivables)}</div>
          <div className="text-[11px] text-amber-800/80 font-medium mt-1">
            Owed by <b>{globalMetrics.receivableCount}</b> customer(s)
          </div>
        </div>

        {/* Total Payables (Dene Hain) */}
        <div 
          onClick={() => setBalanceFilter('payable')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            balanceFilter === 'payable' 
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400' 
              : 'bg-white border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="text-blue-800">Payables (Dene Hain)</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{formatCurrency(globalMetrics.totalPayables)}</div>
          <div className="text-[11px] text-blue-800/80 font-medium mt-1">
            Advance/Credit for <b>{globalMetrics.payableCount}</b> customer(s)
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        
        {/* Quick Filter Tabs: Phone Purchase History & Khata Balance */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
          
          {/* Phone Purchase History Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Phone History:</span>
            
            <button
              type="button"
              onClick={() => setPhoneHistoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phoneHistoryFilter === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({customers.length})
            </button>

            <button
              type="button"
              onClick={() => setPhoneHistoryFilter('has_phones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                phoneHistoryFilter === 'has_phones' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>With Phone Purchases ({globalMetrics.customersWithPhonesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setPhoneHistoryFilter('multi_phones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                phoneHistoryFilter === 'multi_phones' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Repeat Phone Buyers (2+)</span>
            </button>

            <button
              type="button"
              onClick={() => setPhoneHistoryFilter('no_phones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                phoneHistoryFilter === 'no_phones' 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              No Phones Yet ({customers.length - globalMetrics.customersWithPhonesCount})
            </button>
          </div>

          {/* Khata Balance Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Khata:</span>
            
            <button
              type="button"
              onClick={() => setBalanceFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                balanceFilter === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Khata
            </button>

            <button
              type="button"
              onClick={() => setBalanceFilter('receivable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                balanceFilter === 'receivable' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Receivables ({globalMetrics.receivableCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setBalanceFilter('payable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                balanceFilter === 'payable' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Payables ({globalMetrics.payableCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setBalanceFilter('settled')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                balanceFilter === 'settled' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              Settled ($0)
            </button>
          </div>
        </div>

        {/* Search & Detailed Filters Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Universal Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-customers-input"
              placeholder="Search by name, phone, email, IMEI, phone model, or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tag Filter */}
          <div className="md:col-span-3">
            <select
              id="filter-customer-tag"
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="all">All Customer Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Preferred Brand Filter */}
          <div className="md:col-span-2">
            <select
              id="filter-customer-brand"
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="all">All Brands</option>
              {allPreferredBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              id="sort-customers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="recent">Sort: Most Recently Registered</option>
              <option value="phones">Sort: Most Phones Purchased</option>
              <option value="spend">Sort: Highest Total Spend ($)</option>
              <option value="receivable">Sort: Highest Debt (Receivable)</option>
              <option value="invoices">Sort: Most Invoice Transactions</option>
              <option value="name">Sort: Customer Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs text-slate-500">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700">Showing {filteredCustomers.length} of {customers.length} customers</span>
              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Search: "{searchQuery}"
                </span>
              )}
              {phoneHistoryFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                  History: {phoneHistoryFilter.replace('_', ' ')}
                </span>
              )}
              {balanceFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                  Khata: {balanceFilter}
                </span>
              )}
              {selectedTagFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Tag: {selectedTagFilter}
                </span>
              )}
              {selectedBrandFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Brand: {selectedBrandFilter}
                </span>
              )}
            </div>

            <button
              onClick={resetAllFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Main Content Area */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No customer records match your current search terms or filters. Try clearing your search or resetting filters.'
              : 'Start by importing your phone contacts or adding your first customer to build your shop customer directory.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={() => {
                setCustomerToEdit(null);
                setIsAddCustomerModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Customer</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Purchased Phones</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4 text-center">Khata Balance</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const meta = customerMetaMap.get(cust.id);
                  const stats = meta?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
                  const ledger = meta?.ledger || computeCustomerLedger(cust);
                  const ledgerStatus = formatLedgerStatus(ledger, settings.currencySymbol);
                  const linkedSales = meta?.linkedSales || [];
                  const manualPhones = meta?.manualPhones || [];
                  const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
                  const reminder = generateWhatsAppDebtReminder(cust, ledger, settings.shopName, settings.currencySymbol);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Column */}
                      <td className="py-3.5 px-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setSelectedCustomerForModal(cust)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {cust.name}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">{cust.id}</span>
                              {(cust.tags || []).slice(0, 2).map((t, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-700 font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info Column */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${cust.phone}`}
                              className="font-semibold text-slate-800 hover:text-indigo-600 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{cust.phone}</span>
                            </a>
                            {cleanPhone && (
                              <a 
                                href={ledger.balanceType === 'receivable' ? reminder.whatsappUrl : `https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Open WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {cust.email ? (
                            <a 
                              href={`mailto:${cust.email}`}
                              className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 truncate max-w-xs"
                              title={`Send email to ${cust.email}`}
                            >
                              <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                              <span className="truncate">{cust.email}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No email</span>
                          )}
                        </div>
                      </td>

                      {/* Purchased Phones Column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {meta && meta.totalPhonesCount > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                {meta.totalPhonesCount} Phone{meta.totalPhonesCount > 1 ? 's' : ''}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Latest: {linkedSales[0]?.deviceTitle || manualPhones[0]?.itemTitle}
                              </span>
                            </div>
                            {linkedSales[0]?.imei1 && (
                              <div className="text-[10px] font-mono text-slate-400">
                                IMEI: {linkedSales[0].imei1.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                            <span>No phones bought</span>
                            <button
                              onClick={() => handleQuickSellToCustomer(cust)}
                              className="text-[11px] text-indigo-600 hover:underline not-italic font-semibold"
                            >
                              + Sell
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatCurrency(stats.totalSpend)}</div>
                        <div className="text-[11px] text-slate-400">{stats.invoiceCount} invoices</div>
                      </td>

                      {/* Khata Balance */}
                      <td className="py-3.5 px-4 text-center">
                        <div className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                          ledger.balanceType === 'receivable'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : ledger.balanceType === 'payable'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          <span>{ledgerStatus.statusText}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForModal(cust)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Full Profile & Purchased Phones"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerToEdit(cust);
                              setIsAddCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSellToCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Sell Phone to Customer"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const meta = customerMetaMap.get(cust.id);
            const stats = meta?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
            const ledger = meta?.ledger || computeCustomerLedger(cust);
            const ledgerStatus = formatLedgerStatus(ledger, settings.currencySymbol);
            const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
            const reminder = generateWhatsAppDebtReminder(cust, ledger, settings.shopName, settings.currencySymbol);
            const linkedSales = meta?.linkedSales || [];
            const manualPhones = meta?.manualPhones || [];
            const totalPhonesCount = meta?.totalPhonesCount || 0;

            return (
              <div
                key={cust.id}
                id={`customer-card-${cust.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  
                  {/* Customer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedCustomerForModal(cust)}
                    >
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {cust.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">{cust.id}</span>
                      </div>
                    </div>

                    {/* Quick Edit button */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickSellToCustomer(cust)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Sell Phone to Customer"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => {
                          setCustomerToEdit(cust);
                          setIsAddCustomerModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info: Phone & Email */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <a 
                        href={`tel:${cust.phone}`}
                        className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 font-semibold"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cust.phone}</span>
                      </a>
                      
                      {ledger.balanceType === 'receivable' ? (
                        <a 
                          href={reminder.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md font-bold transition-colors shadow-2xs border border-amber-200"
                        >
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          <span>Debt Reminder</span>
                        </a>
                      ) : cleanPhone ? (
                        <a 
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md font-semibold transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      ) : null}
                    </div>

                    {cust.email ? (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <a 
                          href={`mailto:${cust.email}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 truncate"
                          title={`Email ${cust.email}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </a>
                        <span className="text-[10px] text-slate-400 font-mono">Email Verified</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-300" />
                        <span>No email provided</span>
                      </div>
                    )}
                  </div>

                  {/* HISTORY OF PURCHASED PHONES - CORE FEATURE */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-700">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Purchased Phones</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                          {totalPhonesCount}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForModal(cust)}
                        className="text-[11px] text-indigo-600 hover:underline font-semibold"
                      >
                        All History →
                      </button>
                    </div>

                    {totalPhonesCount > 0 ? (
                      <div className="space-y-1.5">
                        {/* Show up to 2 recent phone purchases */}
                        {linkedSales.slice(0, 2).map((sale) => (
                          <div 
                            key={sale.saleId}
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors cursor-pointer space-y-1"
                            title="Click to view purchase invoice bill"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {sale.deviceTitle}
                              </span>
                              <span className="text-xs font-bold text-emerald-700 shrink-0">
                                {formatCurrency(sale.finalAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <span>IMEI:</span>
                                <span className="text-slate-700 font-semibold">{sale.imei1.slice(0, 8)}...</span>
                              </span>
                              <span>{new Date(sale.saleDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}

                        {/* Manual phone logs if any */}
                        {linkedSales.length === 0 && manualPhones.slice(0, 2).map((m) => (
                          <div 
                            key={m.id}
                            className="p-2 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-900 truncate">{m.itemTitle}</span>
                              <span className="font-bold text-emerald-700">{formatCurrency(m.amount)}</span>
                            </div>
                            {m.imeiOrSerial && (
                              <div className="text-[10px] font-mono text-slate-400">IMEI: {m.imeiOrSerial}</div>
                            )}
                          </div>
                        ))}

                        {totalPhonesCount > 2 && (
                          <div 
                            onClick={() => setSelectedCustomerForModal(cust)}
                            className="text-center text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer py-0.5"
                          >
                            +{totalPhonesCount - 2} more phone(s) purchased
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center space-y-1">
                        <p className="text-[11px] text-slate-500">No phones purchased yet</p>
                        <button
                          type="button"
                          onClick={() => handleQuickSellToCustomer(cust)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Sell Phone to {cust.name.split(' ')[0]}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Financial Khata Status Badge */}
                  <div className="p-3 rounded-xl border bg-slate-50/80 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Khata Balance
                      </div>
                      <div className={`text-sm font-extrabold flex items-center gap-1.5 ${ledgerStatus.colorClass}`}>
                        <span>{ledgerStatus.statusText}</span>
                        {ledger.overdueCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Give/Receive Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenLedgerForCustomer(cust, 'debit')}
                        className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
                        title="Give Credit / Sale on Credit (Lene Hain)"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLedgerForCustomer(cust, 'credit')}
                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors"
                        title="Receive Payment (Mujhe Mile)"
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(cust.tags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {t}
                      </span>
                    ))}
                    {(cust.preferences?.preferredBrands || []).slice(0, 2).map((b, idx) => (
                      <span key={`b-${idx}`} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                        {b}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Card Bottom / Footer Statistics */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Lifetime Spend</div>
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(stats.totalSpend)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Invoices / Phones</div>
                    <div className="font-semibold text-slate-700">
                      {totalPhonesCount} device{totalPhonesCount === 1 ? '' : 's'} • {stats.invoiceCount} inv
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomerForModal(cust)}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
                    title="View Full Profile, Phone History & Khata"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
