import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  CreditCard, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Phone,
  Clock,
  Sparkles,
  Wallet
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { LedgerEntryType, LedgerTransactionType } from '../types/mobile';
import { computeCustomerLedger, formatLedgerStatus } from '../utils/ledgerUtils';

export const AddLedgerEntryModal: React.FC = () => {
  const { 
    isAddLedgerModalOpen, 
    setIsAddLedgerModalOpen, 
    selectedCustomerForLedger, 
    setSelectedCustomerForLedger,
    ledgerInitialType,
    addCustomerLedgerEntry,
    formatCurrency,
    settings
  } = useShop();

  const customer = selectedCustomerForLedger;

  // Form State
  const [entryType, setEntryType] = useState<LedgerEntryType>(ledgerInitialType || 'debit');
  const [transactionType, setTransactionType] = useState<LedgerTransactionType>(
    ledgerInitialType === 'credit' ? 'payment_received' : 'receivable_given'
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [description, setDescription] = useState<string>('');
  const [referenceInvoiceOrBill, setReferenceInvoiceOrBill] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Sync entry type toggle
  const handleTypeChange = (type: LedgerEntryType) => {
    setEntryType(type);
    if (type === 'debit') {
      setTransactionType('receivable_given');
    } else {
      setTransactionType('payment_received');
    }
  };

  if (!isAddLedgerModalOpen || !customer) return null;

  const currentSummary = computeCustomerLedger(customer);
  const currentFormatted = formatLedgerStatus(currentSummary, settings.currencySymbol);

  // Calculate projected balance
  const numAmount = parseFloat(amount) || 0;
  const simulatedSummary = {
    ...currentSummary,
    totalDebit: currentSummary.totalDebit + (entryType === 'debit' ? numAmount : 0),
    totalCredit: currentSummary.totalCredit + (entryType === 'credit' ? numAmount : 0),
  };
  const simulatedNet = Math.round((simulatedSummary.totalDebit - simulatedSummary.totalCredit) * 100) / 100;
  let simulatedLabel = 'Settled ($0.00)';
  let simulatedColor = 'text-emerald-400';
  if (simulatedNet > 0.01) {
    simulatedLabel = `${settings.currencySymbol || '$'}${simulatedNet.toLocaleString()} Receivable (Customer Owes)`;
    simulatedColor = 'text-amber-400';
  } else if (simulatedNet < -0.01) {
    simulatedLabel = `${settings.currencySymbol || '$'}${Math.abs(simulatedNet).toLocaleString()} Payable (Shop Owes)`;
    simulatedColor = 'text-blue-400';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      addCustomerLedgerEntry(customer.id, {
        type: entryType,
        transactionType,
        amount: numAmount,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        paymentMethod,
        description: description.trim() || (entryType === 'debit' ? 'Credit Given / Sale Debit' : 'Payment Received'),
        referenceInvoiceOrBill: referenceInvoiceOrBill.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Close & reset
      setIsAddLedgerModalOpen(false);
      setSelectedCustomerForLedger(null);
      setAmount('');
      setDescription('');
      setNotes('');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to record entry');
    }
  };

  return (
    <div id="add-ledger-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="add-ledger-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${entryType === 'debit' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {entryType === 'debit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {entryType === 'debit' ? 'Give Credit / Add Debit' : 'Receive Payment / Add Credit'}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-200">{customer.name}</span>
                {customer.phone && (
                  <span className="text-slate-500">({customer.phone})</span>
                )}
              </p>
            </div>
          </div>
          <button
            id="close-add-ledger-modal"
            onClick={() => {
              setIsAddLedgerModalOpen(false);
              setSelectedCustomerForLedger(null);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Ribbon */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Current Balance:</span>
            <span className={`text-xs font-semibold ${currentFormatted.colorClass}`}>
              {currentFormatted.statusText}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {currentFormatted.subText}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                id="tab-debit-receivable"
                onClick={() => handleTypeChange('debit')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                  entryType === 'debit'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Maine Diye / Lene Hain (Debit)</span>
              </button>

              <button
                type="button"
                id="tab-credit-payment"
                onClick={() => handleTypeChange('credit')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                  entryType === 'credit'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Mujhe Mile / Jama (Credit)</span>
              </button>
            </div>
          </div>

          {/* Specific Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {entryType === 'debit' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTransactionType('receivable_given')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                      transactionType === 'receivable_given'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Goods/Phone on Credit</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Increases customer debt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payment_paid')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                      transactionType === 'payment_paid'
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Cash Paid to Customer</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Settles shop payable debt</div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payment_received')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                      transactionType === 'payment_received'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Payment Recovery Received</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Reduces customer debt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('payable_owed')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                      transactionType === 'payable_owed'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Advance / Shop Credit Owed</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Customer deposit / return credit</div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Amount ({settings.currencySymbol || '$'}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  {settings.currencySymbol || '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  id="ledger-amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Transaction Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  id="ledger-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Payment Method / Channel
              </label>
              <select
                id="ledger-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Cash">Cash In Hand</option>
                <option value="Bank Transfer">Bank Transfer / Raast</option>
                <option value="JazzCash / Easypaisa">JazzCash / Easypaisa</option>
                <option value="Debit/Credit Card">Debit / Credit Card</option>
                <option value="Online UPI / Wallet">Online Wallet</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Expected Recovery Due Date (Optional)</span>
              </label>
              <input
                type="date"
                id="ledger-due-date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description & Invoice Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Item / Purpose Description
              </label>
              <input
                type="text"
                id="ledger-description-input"
                placeholder={entryType === 'debit' ? 'e.g., iPhone 14 Pro sale credit, Screen repair' : 'e.g., Cash installment paid, Raast partial payment'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Invoice / Bill Ref #
              </label>
              <input
                type="text"
                id="ledger-ref-input"
                placeholder="e.g., INV-2026-901"
                value={referenceInvoiceOrBill}
                onChange={(e) => setReferenceInvoiceOrBill(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Projected Balance Preview */}
          {numAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-300 font-medium">Projected New Balance:</span>
              </div>
              <span className={`text-sm font-bold ${simulatedColor}`}>
                {simulatedLabel}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddLedgerModalOpen(false);
                setSelectedCustomerForLedger(null);
              }}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-ledger-entry"
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 rounded-xl transition-all shadow-lg ${
                entryType === 'debit'
                  ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record {entryType === 'debit' ? 'Debit (Lene Hain)' : 'Credit (Jama)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
