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
  Clock
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer } from '../types/mobile';
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
    settings
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'receivable' | 'payable' | 'overdue' | 'settled'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'receivable' | 'spend' | 'name' | 'invoices'>('recent');

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
    const map = new Map<string, { stats: CustomerStat; ledger: ReturnType<typeof computeCustomerLedger> }>();
    
    customers.forEach((cust) => {
      const linkedSales = sales.filter(
        (s) => (s.customer?.phone && s.customer.phone === cust.phone) || (s.customer?.name && s.customer.name.toLowerCase() === cust.name.toLowerCase())
      );
      const totalInvoiced = linkedSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
      const manualSpend = (cust.manualPurchases || []).reduce((acc, m) => acc + (m.amount || 0), 0);
      
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
          manualCount: (cust.manualPurchases || []).length,
          matchedPhones: matched,
        },
        ledger,
      });
    });

    return map;
  }, [customers, sales, inventory]);

  // Global Ledger Summary Metrics
  const globalLedgerMetrics = useMemo(() => {
    let totalReceivables = 0;
    let totalPayables = 0;
    let receivableCount = 0;
    let payableCount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    customers.forEach((c) => {
      const data = customerMetaMap.get(c.id);
      if (!data) return;
      const { ledger } = data;

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
    };
  }, [customers, customerMetaMap]);

  // Total Lifetime Customer Revenue
  const totalLifetimeCustomerRevenue = useMemo(() => {
    return Array.from(customerMetaMap.values()).reduce((acc: number, val: { stats: CustomerStat; ledger: any }) => acc + (val.stats?.totalSpend || 0), 0);
  }, [customerMetaMap]);

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
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

      // Search matching name, phone, email, cnic, notes
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cust.name.toLowerCase().includes(q);
        const matchesPhone = cust.phone.toLowerCase().includes(q);
        const matchesEmail = cust.email ? cust.email.toLowerCase().includes(q) : false;
        const matchesId = cust.cnicOrGovId ? cust.cnicOrGovId.toLowerCase().includes(q) : false;
        const matchesBrands = (cust.preferences?.preferredBrands || []).some((b) => b.toLowerCase().includes(q));
        const matchesNotes = cust.preferences?.notes ? cust.preferences.notes.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesId && !matchesBrands && !matchesNotes) {
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
    }).sort((a, b) => {
      const metaA = customerMetaMap.get(a.id);
      const metaB = customerMetaMap.get(b.id);
      const statsA = metaA?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
      const statsB = metaB?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
      const ledgerA = metaA?.ledger;
      const ledgerB = metaB?.ledger;

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
  }, [customers, searchQuery, balanceFilter, selectedTagFilter, selectedBrandFilter, sortBy, customerMetaMap]);

  const handleOpenLedgerForCustomer = (customer: Customer, type: 'debit' | 'credit') => {
    setSelectedCustomerForLedger(customer);
    setLedgerInitialType(type);
    setIsAddLedgerModalOpen(true);
  };

  return (
    <div id="customers-management-view" className="space-y-6">
      
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Customer CRM & Khata Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage phone contacts, track credit (Udhar/Receivables), payments received, and device preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Contact Access & Import Button */}
          <button
            id="import-phone-contacts-btn"
            onClick={() => setIsContactImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Import phone contacts from device address book or vCard .vcf"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Import Contacts</span>
          </button>

          {/* Quick Khata Entry */}
          <button
            id="quick-khata-entry-btn"
            onClick={() => {
              setSelectedCustomerForLedger(null);
              setLedgerInitialType('debit');
              setIsAddLedgerModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>+ Khata Entry</span>
          </button>

          {/* Export Customers to Excel */}
          <button
            id="export-customers-sheet-btn"
            onClick={() => exportCustomersToSheets('xlsx')}
            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Export all customers and preferences to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export</span>
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

      {/* Metric Cards Banner - Highlighting Khata & Debtors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
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
            <span className="text-amber-800">Total Receivables (Lene Hain)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{formatCurrency(globalLedgerMetrics.totalReceivables)}</div>
          <div className="text-[11px] text-amber-800/80 font-medium mt-1">
            Owed by <b>{globalLedgerMetrics.receivableCount}</b> customer(s)
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
            <span className="text-blue-800">Total Payables (Dene Hain)</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{formatCurrency(globalLedgerMetrics.totalPayables)}</div>
          <div className="text-[11px] text-blue-800/80 font-medium mt-1">
            Advance/Credit for <b>{globalLedgerMetrics.payableCount}</b> customer(s)
          </div>
        </div>

        {/* Overdue Debt Alert */}
        <div 
          onClick={() => setBalanceFilter('overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            balanceFilter === 'overdue' 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400' 
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="text-rose-800">Overdue Debt Recoveries</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {globalLedgerMetrics.overdueCount > 0 ? formatCurrency(globalLedgerMetrics.overdueAmount) : '$0.00'}
          </div>
          <div className="text-[11px] text-rose-800/80 font-medium mt-1">
            {globalLedgerMetrics.overdueCount > 0 ? (
              <span className="font-bold text-rose-600">{globalLedgerMetrics.overdueCount} payment(s) past due</span>
            ) : (
              'All payments up to date'
            )}
          </div>
        </div>

        {/* Total Customers */}
        <div 
          onClick={() => setBalanceFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            balanceFilter === 'all' 
              ? 'bg-indigo-50/50 border-indigo-400' 
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Total CRM Clients</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Lifetime spend: {formatCurrency(totalLifetimeCustomerRevenue)}
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        
        {/* Khata Balance Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setBalanceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              balanceFilter === 'all' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Accounts ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setBalanceFilter('receivable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              balanceFilter === 'receivable' 
                ? 'bg-amber-600 text-white' 
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
            <span>Receivables (Lene Hain) • {globalLedgerMetrics.receivableCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setBalanceFilter('payable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              balanceFilter === 'payable' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" />
            <span>Payables (Dene Hain) • {globalLedgerMetrics.payableCount}</span>
          </button>

          {globalLedgerMetrics.overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setBalanceFilter('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                balanceFilter === 'overdue' 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Overdue Debtors ({globalLedgerMetrics.overdueCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setBalanceFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              balanceFilter === 'settled' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Settled ($0)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-customers-input"
              placeholder="Search by name, phone, email, national ID, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
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
              <option value="all">All Tags ({customers.length})</option>
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
          <div className="md:col-span-2">
            <select
              id="sort-customers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="receivable">Sort: Highest Debt (Receivable)</option>
              <option value="spend">Sort: Highest Spend</option>
              <option value="invoices">Sort: Most Purchases</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Customer Cards & Directory List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery || balanceFilter !== 'all' || selectedTagFilter !== 'all' || selectedBrandFilter !== 'all'
              ? 'No customer records match your current filters. Try resetting search filters or import contacts from your phone.'
              : 'Start by importing your phone contacts or adding your first customer to build your shop ledger.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setBalanceFilter('all');
                setSelectedTagFilter('all');
                setSelectedBrandFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsContactImportModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Import Phone Contacts</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const meta = customerMetaMap.get(cust.id);
            const stats = meta?.stats || { totalSpend: 0, invoiceCount: 0, manualCount: 0, matchedPhones: 0 };
            const ledger = meta?.ledger || computeCustomerLedger(cust);
            const ledgerStatus = formatLedgerStatus(ledger, settings.currencySymbol);
            const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
            const reminder = generateWhatsAppDebtReminder(cust, ledger, settings.shopName, settings.currencySymbol);

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
                        title="Give Credit (Lene Hain)"
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

                  {/* Contact Methods */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <a 
                        href={`tel:${cust.phone}`}
                        className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cust.phone}</span>
                      </a>
                      
                      {ledger.balanceType === 'receivable' ? (
                        <a 
                          href={reminder.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md font-bold transition-colors shadow-2xs"
                        >
                          <MessageSquare className="w-3 h-3" />
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

                    {cust.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
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
                  </div>

                  {/* Preferences Highlight */}
                  <div className="space-y-1 text-xs">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Preferred Brands</div>
                    <div className="flex flex-wrap gap-1">
                      {(cust.preferences?.preferredBrands || []).length > 0 ? (
                        cust.preferences.preferredBrands.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]">
                            {b}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No specific brand</span>
                      )}
                    </div>
                  </div>

                  {/* Stock Matches Badge */}
                  {stats.matchedPhones > 0 && (
                    <div 
                      onClick={() => setSelectedCustomerForModal(cust)}
                      className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{stats.matchedPhones} In-Stock Matches</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700">View →</span>
                    </div>
                  )}

                </div>

                {/* Card Bottom / Footer Statistics */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Lifetime Spend</div>
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(stats.totalSpend)}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Ledger / Invoices</div>
                    <div className="font-semibold text-slate-700">
                      {cust.ledgerEntries?.length || 0} entries • {stats.invoiceCount} phones
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomerForModal(cust)}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
                    title="View Customer Khata & Profile"
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
