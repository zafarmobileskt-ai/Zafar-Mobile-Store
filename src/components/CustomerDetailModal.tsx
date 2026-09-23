import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Tag, 
  Sliders, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Smartphone, 
  ShieldCheck, 
  MessageSquare, 
  DollarSign, 
  Sparkles, 
  Edit3, 
  Calendar,
  Layers,
  FileText,
  Clock,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  AlertTriangle,
  Send,
  Printer,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, ManualPurchaseLog, SaleRecord, MobileItem, CustomerLedgerEntry } from '../types/mobile';
import { computeCustomerLedger, formatLedgerStatus, generateWhatsAppDebtReminder } from '../utils/ledgerUtils';

interface CustomerDetailModalProps {
  customer?: Customer | null;
  onClose?: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ 
  customer: propCustomer, 
  onClose: propOnClose 
}) => {
  const { 
    sales, 
    inventory, 
    formatCurrency, 
    addManualPurchaseToCustomer, 
    updateManualPurchase,
    deleteManualPurchase,
    deleteCustomerLedgerEntry,
    updateCustomerLedgerEntry,
    setIsAddLedgerModalOpen,
    setSelectedCustomerForLedger,
    setLedgerInitialType,
    setCustomerToEdit, 
    setIsAddCustomerModalOpen,
    setSelectedInvoiceForModal,
    setSelectedDeviceForSale,
    setIsPosModalOpen,
    deleteCustomer,
    selectedCustomerForModal,
    setSelectedCustomerForModal,
    settings
  } = useShop();

  const customer = propCustomer || selectedCustomerForModal;

  const onClose = () => {
    if (propOnClose) propOnClose();
    setSelectedCustomerForModal(null);
  };

  const [activeSubTab, setActiveSubTab] = useState<'khata' | 'overview' | 'purchases' | 'matches' | 'preferences'>('khata');
  const [showAddPurchaseForm, setShowAddPurchaseForm] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'debit' | 'credit' | 'overdue'>('all');
  
  // Ledger Entry Edit Modal State
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<CustomerLedgerEntry | null>(null);
  const [editLedgerDate, setEditLedgerDate] = useState('');
  const [editLedgerDueDate, setEditLedgerDueDate] = useState('');
  const [editLedgerDescription, setEditLedgerDescription] = useState('');
  const [editLedgerNotes, setEditLedgerNotes] = useState('');
  const [editLedgerAmount, setEditLedgerAmount] = useState('');
  const [editLedgerPaymentMethod, setEditLedgerPaymentMethod] = useState('');

  // Manual purchase form & edit state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<'Phone' | 'Accessory' | 'Repair / Screen' | 'Audio / Buds' | 'Other'>('Accessory');
  const [manualAmount, setManualAmount] = useState('');
  const [manualImei, setManualImei] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNotes, setManualNotes] = useState('');
  const [editingManualPurchaseId, setEditingManualPurchaseId] = useState<string | null>(null);
  const [editManualPurchaseDate, setEditManualPurchaseDate] = useState('');

  if (!customer) return null;

  // Ledger Summary
  const ledgerSummary = computeCustomerLedger(customer);
  const ledgerStatus = formatLedgerStatus(ledgerSummary, settings.currencySymbol);

  // Find linked sales from invoices
  const linkedSales: SaleRecord[] = sales.filter((s) => {
    const phoneMatch = s.customer?.phone && customer.phone && s.customer.phone.replace(/\D/g, '') === customer.phone.replace(/\D/g, '');
    const nameMatch = s.customer?.name && customer.name && s.customer.name.trim().toLowerCase() === customer.name.trim().toLowerCase();
    return phoneMatch || nameMatch;
  });

  const manualPurchases: ManualPurchaseLog[] = customer.manualPurchases || [];
  const ledgerEntries: CustomerLedgerEntry[] = customer.ledgerEntries || [];

  // Calculate lifetime totals
  const totalInvoicedSpend = linkedSales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
  const totalManualSpend = manualPurchases.reduce((acc, m) => acc + (m.amount || 0), 0);
  const totalSpend = totalInvoicedSpend + totalManualSpend;
  const totalItemsCount = linkedSales.length + manualPurchases.length;

  // Find in-stock inventory matching customer preferences
  const matchingStock: MobileItem[] = inventory.filter((item) => {
    if (item.status !== 'in_stock') return false;
    const prefBrands = customer.preferences?.preferredBrands || [];
    if (prefBrands.length > 0 && !prefBrands.includes(item.brand)) {
      return false;
    }
    const prefCondition = customer.preferences?.conditionPreference;
    if (prefCondition === 'New Only' && item.deviceType !== 'new') return false;
    if (prefCondition === 'Certified Used / Pre-Owned' && item.deviceType !== 'used') return false;
    return true;
  });

  const handleOpenAddLedger = (type: 'debit' | 'credit') => {
    setSelectedCustomerForLedger(customer);
    setLedgerInitialType(type);
    setIsAddLedgerModalOpen(true);
  };

  const handleAddManualPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualAmount) return;

    addManualPurchaseToCustomer(customer.id, {
      itemTitle: manualTitle.trim(),
      category: manualCategory,
      amount: parseFloat(manualAmount) || 0,
      date: new Date(manualDate).toISOString(),
      imeiOrSerial: manualImei.trim() || undefined,
      notes: manualNotes.trim() || undefined,
    });

    setManualTitle('');
    setManualAmount('');
    setManualImei('');
    setManualNotes('');
    setShowAddPurchaseForm(false);
  };

  const startEditLedgerEntry = (entry: CustomerLedgerEntry) => {
    setEditingLedgerEntry(entry);
    setEditLedgerDate(entry.date ? entry.date.split('T')[0] : '');
    setEditLedgerDueDate(entry.dueDate ? entry.dueDate.split('T')[0] : '');
    setEditLedgerDescription(entry.description || '');
    setEditLedgerNotes(entry.notes || '');
    setEditLedgerAmount(entry.amount.toString());
    setEditLedgerPaymentMethod(entry.paymentMethod || 'Cash');
  };

  const handleSaveLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLedgerEntry) return;
    const numAmount = parseFloat(editLedgerAmount);
    updateCustomerLedgerEntry(customer.id, editingLedgerEntry.id, {
      date: editLedgerDate ? new Date(editLedgerDate).toISOString() : editingLedgerEntry.date,
      dueDate: editLedgerDueDate ? new Date(editLedgerDueDate).toISOString() : undefined,
      description: editLedgerDescription.trim() || editingLedgerEntry.description,
      notes: editLedgerNotes.trim() || undefined,
      amount: !isNaN(numAmount) && numAmount > 0 ? numAmount : editingLedgerEntry.amount,
      paymentMethod: editLedgerPaymentMethod as any,
    });
    setEditingLedgerEntry(null);
  };

  const handleSaveManualPurchaseDate = (purchaseId: string) => {
    if (!editManualPurchaseDate) return;
    updateManualPurchase(customer.id, purchaseId, {
      date: new Date(editManualPurchaseDate).toISOString(),
    });
    setEditingManualPurchaseId(null);
  };

  const handleStartSaleForMatch = (device: MobileItem) => {
    setSelectedDeviceForSale(device);
    setIsPosModalOpen(true);
    onClose();
  };

  const cleanPhoneForWhatsApp = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const debtReminder = generateWhatsAppDebtReminder(customer, ledgerSummary, settings.shopName, settings.currencySymbol);

  // Filtered Ledger Entries
  const now = new Date();
  const filteredLedger = ledgerEntries.filter((entry) => {
    if (ledgerFilter === 'debit') return entry.type === 'debit';
    if (ledgerFilter === 'credit') return entry.type === 'credit';
    if (ledgerFilter === 'overdue') return entry.type === 'debit' && entry.dueDate && new Date(entry.dueDate) < now;
    return true;
  });

  // Print Khata Statement
  const handlePrintKhata = () => {
    window.print();
  };

  return (
    <div id="customer-detail-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative">
          <button
            id="close-customer-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 flex items-center justify-center text-xl font-bold shrink-0 shadow-inner">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{customer.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
                    {customer.id}
                  </span>
                  
                  {/* Balance Badge in Header */}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${ledgerStatus.pillClass}`}>
                    {ledgerStatus.shortBadge}
                  </span>
                </div>
                
                {/* Contact Pills */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
                  <a 
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/15"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{customer.phone}</span>
                  </a>
                  {customer.email && (
                    <a 
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/15"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>{customer.email}</span>
                    </a>
                  )}
                  {cleanPhoneForWhatsApp && (
                    <a 
                      href={`https://wa.me/${cleanPhoneForWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:bg-emerald-900/60"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                id="header-btn-give-credit"
                onClick={() => handleOpenAddLedger('debit')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+ Give Credit</span>
              </button>

              <button
                type="button"
                id="header-btn-receive-payment"
                onClick={() => handleOpenAddLedger('credit')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>+ Receive $</span>
              </button>

              <button
                id="edit-customer-btn"
                onClick={() => {
                  setCustomerToEdit(customer);
                  setIsAddCustomerModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 border border-white/15 transition-all shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-white/10">
            {(customer.tags || []).map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {ledgerSummary.balanceType === 'receivable' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <AlertTriangle className="w-3 h-3" />
                Receivable: {formatCurrency(ledgerSummary.pendingReceivable)}
              </span>
            )}
          </div>
        </div>

        {/* Financial Status Highlight Banner */}
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          ledgerSummary.balanceType === 'receivable' 
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : ledgerSummary.balanceType === 'payable'
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              ledgerSummary.balanceType === 'receivable'
                ? 'bg-amber-100 text-amber-700'
                : ledgerSummary.balanceType === 'payable'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                {ledgerSummary.balanceType === 'receivable' ? 'Customer Outstanding Balance (Lene Hain)' : ledgerSummary.balanceType === 'payable' ? 'Shop Advance / Payable (Dene Hain)' : 'Account Balance'}
              </div>
              <div className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                <span>{ledgerStatus.statusText}</span>
                {ledgerSummary.overdueCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {ledgerSummary.overdueCount} Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {ledgerSummary.balanceType === 'receivable' && (
              <a
                href={debtReminder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Reminder</span>
              </a>
            )}
            
            <button
              onClick={() => handleOpenAddLedger('debit')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
              <span>Give Credit</span>
            </button>

            <button
              onClick={() => handleOpenAddLedger('credit')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Receive Payment</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto">
          <button
            id="tab-khata"
            onClick={() => setActiveSubTab('khata')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === 'khata'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Credit / Debit Ledger (Khata)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              {ledgerEntries.length}
            </span>
          </button>

          <button
            id="tab-overview"
            onClick={() => setActiveSubTab('overview')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Overview</span>
          </button>
          
          <button
            id="tab-purchases"
            onClick={() => setActiveSubTab('purchases')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === 'purchases'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Purchase History ({totalItemsCount})</span>
          </button>

          <button
            id="tab-preferences"
            onClick={() => setActiveSubTab('preferences')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === 'preferences'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferences & Wishlist</span>
          </button>

          <button
            id="tab-matches"
            onClick={() => setActiveSubTab('matches')}
            className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === 'matches'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>In-Stock Matches ({matchingStock.length})</span>
            {matchingStock.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 0: CREDIT / DEBIT LEDGER (KHATA) */}
          {activeSubTab === 'khata' && (
            <div className="space-y-5">
              {/* Top Financial Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    <span>Total Debit (Lene Hain)</span>
                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(ledgerSummary.totalDebit)}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Goods / Phones given on credit</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    <span>Total Credit (Mujhe Mile)</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(ledgerSummary.totalCredit)}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Payments & recoveries received</div>
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
                    <span>Net Balance Status</span>
                    <Wallet className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className={`text-xl font-extrabold ${ledgerStatus.colorClass}`}>
                    {ledgerStatus.statusText}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{ledgerStatus.subText}</div>
                </div>
              </div>

              {/* Opening Balance Card if configured */}
              {customer.openingBalance && customer.openingBalance.amount > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-800">Opening Balance: </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(customer.openingBalance.amount)} ({customer.openingBalance.type === 'receivable' ? 'Receivable - Customer owed' : 'Payable - Shop owed'})
                      </span>
                      {customer.openingBalance.notes && (
                        <span className="text-slate-500 ml-2">({customer.openingBalance.notes})</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Set on: {customer.openingBalance.date ? new Date(customer.openingBalance.date).toLocaleDateString() : 'Account Creation'}
                  </span>
                </div>
              )}

              {/* Action Toolbar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      ledgerFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Transactions ({ledgerEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('debit')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      ledgerFilter === 'debit' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Debits (Lene Hain)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('credit')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      ledgerFilter === 'credit' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Credits (Mujhe Mile)
                  </button>
                  {ledgerSummary.overdueCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setLedgerFilter('overdue')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        ledgerFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      Overdue ({ledgerSummary.overdueCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddLedger('debit')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+ Give Credit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddLedger('credit')}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>+ Receive Payment</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              {filteredLedger.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">No Ledger Records Found</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Record credit sales (Lene Hain), customer partial payments, or advance deposits to maintain an accurate digital Khata for this customer.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddLedger('debit')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm"
                    >
                      + Record Credit (Debit)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddLedger('credit')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm"
                    >
                      + Record Payment (Credit)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Description / Details</th>
                          <th className="p-3">Payment Channel</th>
                          <th className="p-3">Debit (Lene Hain)</th>
                          <th className="p-3">Credit (Mujhe Mile)</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredLedger.map((entry) => {
                          const isDebit = entry.type === 'debit';
                          const isOverdue = isDebit && entry.dueDate && new Date(entry.dueDate) < now;
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <div className="font-semibold text-slate-900">{new Date(entry.date).toLocaleDateString()}</div>
                                  <button
                                    type="button"
                                    onClick={() => startEditLedgerEntry(entry)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Edit saved date or transaction details"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{entry.id}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                  isDebit 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {isDebit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                  {isDebit ? 'Debit (Maine Diye)' : 'Credit (Mujhe Mile)'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{entry.description}</div>
                                {entry.referenceInvoiceOrBill && (
                                  <span className="inline-block mt-0.5 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    Ref: {entry.referenceInvoiceOrBill}
                                  </span>
                                )}
                                {entry.notes && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">{entry.notes}</div>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap text-slate-700 font-medium">
                                {entry.paymentMethod || 'Cash'}
                              </td>
                              <td className="p-3 whitespace-nowrap font-bold text-amber-700 text-sm">
                                {isDebit ? formatCurrency(entry.amount) : '—'}
                              </td>
                              <td className="p-3 whitespace-nowrap font-bold text-emerald-700 text-sm">
                                {!isDebit ? formatCurrency(entry.amount) : '—'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {entry.dueDate ? (
                                  <div className="flex items-center gap-1">
                                    <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                      {new Date(entry.dueDate).toLocaleDateString()}
                                    </span>
                                    {isOverdue && (
                                      <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                                        OVERDUE
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditLedgerEntry(entry)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit date & transaction details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('Delete this ledger transaction?')) {
                                        deleteCustomerLedgerEntry(customer.id, entry.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              )}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                    <span>Lifetime Spend</span>
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(totalSpend)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{totalItemsCount} transactions total</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                    <span>Device Invoices</span>
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{linkedSales.length}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{formatCurrency(totalInvoicedSpend)} invoiced</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                    <span>Khata Net Balance</span>
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">{ledgerStatus.shortBadge}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{ledgerEntries.length} ledger logs</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                    <span>Target Matching</span>
                    <Sparkles className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">{matchingStock.length} phones</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready for immediate sale</div>
                </div>
              </div>

              {/* Contact & Identity Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>Customer Information</span>
                  </h3>
                  
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Full Name</span>
                      <span className="font-semibold text-slate-900">{customer.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone Number</span>
                      <span className="font-semibold text-slate-900">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Email Address</span>
                      <span className="font-medium text-slate-800">{customer.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">CNIC / Gov ID</span>
                      <span className="font-mono text-slate-800">{customer.cnicOrGovId || 'Not recorded'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Physical Address</span>
                      <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">{customer.address || 'Walk-in customer'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Khata Summary */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <span>Customer Khata & Balance</span>
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Balance Type</span>
                      <span className="font-bold text-slate-900 uppercase">{ledgerSummary.balanceType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Total Given (Debit)</span>
                      <span className="font-semibold text-amber-700">{formatCurrency(ledgerSummary.totalDebit)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Total Received (Credit)</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(ledgerSummary.totalCredit)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold">Outstanding Net</span>
                      <span className={`font-extrabold ${ledgerStatus.colorClass}`}>{ledgerStatus.statusText}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('khata')}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors text-center"
                    >
                      Open Full Customer Khata Statement →
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Shop Internal Notes</div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PURCHASES */}
          {activeSubTab === 'purchases' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Purchase & Invoiced History</h3>
                  <p className="text-xs text-slate-500">All registered phone sales and manual items linked to {customer.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseForm(!showAddPurchaseForm)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddPurchaseForm ? 'Hide Form' : 'Log Past Purchase'}</span>
                </button>
              </div>

              {/* Manual Purchase Add Form */}
              {showAddPurchaseForm && (
                <form onSubmit={handleAddManualPurchase} className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Log Past Accessory or Device Purchase</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Item Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 20W Fast Charger, Silicone Case, Screen Guard"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Accessory">Accessory</option>
                        <option value="Audio / Buds">Audio / Buds</option>
                        <option value="Repair / Screen">Repair / Screen</option>
                        <option value="Phone">Phone</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Price / Amount ({settings.currencySymbol || '$'}) *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Purchase Date</label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">IMEI / Serial (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Serial # or IMEI"
                        value={manualImei}
                        onChange={(e) => setManualImei(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Purchased with discount, 6 months warranty"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPurchaseForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      Save Purchase Log
                    </button>
                  </div>
                </form>
              )}

              {/* Invoices List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device Sale Invoices ({linkedSales.length})</div>
                {linkedSales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No formal device invoices generated under this phone number yet.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedSales.map((sale) => (
                      <div key={sale.saleId} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-xs sm:text-sm text-slate-900">{sale.deviceTitle}</div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>Inv: {sale.invoiceNumber}</span>
                            <span>Date: {new Date(sale.saleDate).toLocaleDateString()}</span>
                            <span>Paid: {sale.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-indigo-600">{formatCurrency(sale.finalAmount)}</div>
                          <button
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5 justify-end mt-0.5"
                          >
                            <span>View Bill</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Purchases List */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accessories & Manual Logs ({manualPurchases.length})</div>
                {manualPurchases.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No accessory purchases logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {manualPurchases.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900">{item.itemTitle}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {item.category}
                            </span>
                          </div>
                          {editingManualPurchaseId === item.id ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="date"
                                value={editManualPurchaseDate}
                                onChange={(e) => setEditManualPurchaseDate(e.target.value)}
                                className="px-1.5 py-0.5 border border-slate-300 rounded text-xs text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveManualPurchaseDate(item.id)}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Save Date
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingManualPurchaseId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditManualPurchaseDate(item.date ? item.date.split('T')[0] : '');
                                  setEditingManualPurchaseId(item.id);
                                }}
                                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 text-[10px] cursor-pointer font-medium"
                                title="Edit saved purchase date"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Edit Date</span>
                              </button>
                              {item.notes && <span>• {item.notes}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                          <button
                            onClick={() => deleteManualPurchase(customer.id, item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & WISHLIST */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buying Preferences & Wishlist</h3>
                  <p className="text-xs text-slate-500">Customer target specifications, preferred brands, and alert settings</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerToEdit(customer);
                    setIsAddCustomerModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Update Preferences</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Brands</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(customer.preferences?.preferredBrands || []).length > 0 ? (
                      customer.preferences.preferredBrands.map((brand, i) => (
                        <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-200">
                          {brand}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No brand preference specified</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Budget & Capacity</div>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget Range:</span>
                      <span className="font-semibold text-slate-900">{customer.preferences?.budgetRange || 'Flexible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Target:</span>
                      <span className="font-semibold text-slate-900">{customer.preferences?.storagePreference || 'Any'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Condition:</span>
                      <span className="font-semibold text-slate-900">{customer.preferences?.conditionPreference || 'Both New & Used'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interested Categories</div>
                <div className="flex flex-wrap gap-1.5">
                  {(customer.preferences?.interestedCategories || []).length > 0 ? (
                    customer.preferences.interestedCategories.map((cat, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 font-medium rounded-lg text-xs">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Standard Flagship / Smartphone upgrades</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Wishlist & Specific Notes</div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {customer.preferences?.notes || 'No specific wishlist notes currently recorded.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: IN-STOCK MATCHES */}
          {activeSubTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">In-Stock Devices Matching Preferences</h3>
                  <p className="text-xs text-slate-500">Active inventory matching customer&apos;s preferred brands ({customer.preferences?.preferredBrands?.join(', ') || 'All'})</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {matchingStock.length} Matches In-Stock
                </span>
              </div>

              {matchingStock.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">No immediate in-stock inventory matches current preferred brands</p>
                  <p className="text-xs text-slate-500">When you add new inventory for {customer.preferences?.preferredBrands?.join(', ') || 'their preferred brands'}, it will automatically appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchingStock.map((device) => (
                    <div 
                      key={device.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{device.brand} {device.model}</div>
                            <div className="text-xs text-slate-500">{device.storage} • {device.color}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            device.deviceType === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {device.deviceType === 'new' ? 'Brand New' : `Used (${device.conditionGrade || 'Grade A'})`}
                          </span>
                        </div>

                        <div className="text-xs font-mono text-slate-600">IMEI: {device.imei1}</div>
                        {device.batteryHealth && (
                          <div className="text-xs text-slate-600">Battery Health: <span className="font-semibold text-emerald-600">{device.batteryHealth}%</span></div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Retail Target</div>
                          <div className="text-sm font-bold text-indigo-600">{formatCurrency(device.sellingPriceTarget)}</div>
                        </div>

                        <button
                          onClick={() => handleStartSaleForMatch(device)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Sell via POS</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Profile Created: {new Date(customer.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete customer ${customer.name}? This will not delete past invoices.`)) {
                  deleteCustomer(customer.id);
                  onClose();
                }
              }}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
            >
              Delete Customer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Edit Ledger Entry Modal */}
        {editingLedgerEntry && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Edit Khata Entry & Save Date</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {editingLedgerEntry.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLedgerEntry(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLedgerEntry} className="p-5 space-y-4">
                {/* Transaction Date with Quick Today */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Transaction Date *</label>
                    <button
                      type="button"
                      onClick={() => setEditLedgerDate(new Date().toISOString().split('T')[0])}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={editLedgerDate}
                    onChange={(e) => setEditLedgerDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Due Date if applicable */}
                {editingLedgerEntry.type === 'debit' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Payment Due Date (Optional)</label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 15);
                            setEditLedgerDueDate(d.toISOString().split('T')[0]);
                          }}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          +15 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLedgerDueDate('')}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={editLedgerDueDate}
                      onChange={(e) => setEditLedgerDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount ({settings.currencySymbol || 'Rs'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={editLedgerAmount}
                    onChange={(e) => setEditLedgerAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Item *</label>
                  <input
                    type="text"
                    required
                    value={editLedgerDescription}
                    onChange={(e) => setEditLedgerDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Channel</label>
                  <select
                    value={editLedgerPaymentMethod}
                    onChange={(e) => setEditLedgerPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
                    <option value="Debit/Credit Card">Debit/Credit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes (Optional)</label>
                  <input
                    type="text"
                    value={editLedgerNotes}
                    onChange={(e) => setEditLedgerNotes(e.target.value)}
                    placeholder="e.g. Promised by Monday, partial adjustment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLedgerEntry(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
