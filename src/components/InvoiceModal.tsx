import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { SaleRecord } from '../types/mobile';
import { 
  X, 
  Printer, 
  Smartphone, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Mail, 
  QrCode, 
  CheckCircle2, 
  Download,
  Edit3,
  Calendar,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { selectedInvoiceForModal, setSelectedInvoiceForModal, settings, formatCurrency, updateSale } = useShop();

  const [isEditingSaleDate, setIsEditingSaleDate] = useState(false);
  const [tempSaleDate, setTempSaleDate] = useState('');
  const [dateSuccess, setDateSuccess] = useState(false);

  // Full Entry Editing State
  const [isEditingFullEntry, setIsEditingFullEntry] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerCnic, setEditCustomerCnic] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editSaleDate, setEditSaleDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSoldPrice, setEditSoldPrice] = useState<number | ''>('');
  const [fullSaveSuccess, setFullSaveSuccess] = useState(false);

  if (!selectedInvoiceForModal) return null;
  const invoice: SaleRecord = selectedInvoiceForModal;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSaleDate = () => {
    if (!tempSaleDate) return;
    const newIso = new Date(tempSaleDate).toISOString();
    updateSale(invoice.saleId, { saleDate: newIso });
    setIsEditingSaleDate(false);
    setDateSuccess(true);
    setTimeout(() => setDateSuccess(false), 2500);
  };

  const startEditFullEntry = () => {
    setEditCustomerName(invoice.customer.name || '');
    setEditCustomerPhone(invoice.customer.phone || '');
    setEditCustomerCnic(invoice.customer.cnicOrGovId || '');
    setEditCustomerAddress(invoice.customer.address || '');
    setEditPaymentMethod(invoice.paymentMethod || 'Cash');
    setEditSaleDate(invoice.saleDate ? invoice.saleDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditNotes(invoice.notes || '');
    setEditSoldPrice(invoice.soldPrice || '');
    setIsEditingFullEntry(true);
  };

  const resetEditEntryForm = () => {
    setEditCustomerName('');
    setEditCustomerPhone('');
    setEditCustomerCnic('');
    setEditCustomerAddress('');
    setEditPaymentMethod('Cash');
    setEditSaleDate(new Date().toISOString().split('T')[0]);
    setEditNotes('');
    setEditSoldPrice('');
  };

  const handleSaveFullEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newDateIso = editSaleDate ? new Date(editSaleDate).toISOString() : invoice.saleDate;
    const numPrice = Number(editSoldPrice) || invoice.soldPrice;
    const finalAmount = numPrice - (invoice.discount || 0) - (invoice.tradeInItem?.agreedValue || 0);
    const profit = finalAmount - (invoice.purchaseCost || 0);

    updateSale(invoice.saleId, {
      saleDate: newDateIso,
      paymentMethod: editPaymentMethod,
      soldPrice: numPrice,
      finalAmount,
      profit,
      notes: editNotes.trim() || undefined,
      customer: {
        ...invoice.customer,
        name: editCustomerName.trim() || invoice.customer.name,
        phone: editCustomerPhone.trim() || invoice.customer.phone,
        cnicOrGovId: editCustomerCnic.trim() || undefined,
        address: editCustomerAddress.trim() || undefined,
      }
    });

    setIsEditingFullEntry(false);
    setFullSaveSuccess(true);
    setTimeout(() => setFullSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="bg-[#12151E] rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800 print:border-none print:shadow-none print:bg-white">
        
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="bg-[#0B0D14] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Sale Invoice & Warranty Certificate</span>
            <span className="font-mono text-xs text-slate-400">({invoice.invoiceNumber})</span>
            {fullSaveSuccess && (
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
                ✓ Entry Updated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEditFullEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#171B26] hover:bg-[#1E2435] text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm"
              title="Edit saved entry details (date, customer, pricing, payment)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Entry</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setSelectedInvoiceForModal(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Full Entry Drawer / Dialog */}
        {isEditingFullEntry && (
          <form onSubmit={handleSaveFullEntry} className="p-5 bg-slate-900 border-b border-amber-500/30 space-y-4 print:hidden animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Edit Saved Invoice Entry</h3>
                <span className="text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingFullEntry(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Sale Date with Today button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">Sale Date *</label>
                  <button
                    type="button"
                    onClick={() => setEditSaleDate(new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  value={editSaleDate}
                  onChange={(e) => setEditSaleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Customer Phone *</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Customer CNIC */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">CNIC / ID Card</label>
                <input
                  type="text"
                  value={editCustomerCnic}
                  onChange={(e) => setEditCustomerCnic(e.target.value)}
                  placeholder="35202-xxxxxxx-x"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                  <option value="Partial / Split">Partial / Split</option>
                  <option value="Full Credit (Khata)">Full Credit (Khata)</option>
                </select>
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Sold Price ({settings.currencySymbol || '$'})
                </label>
                <input
                  type="number"
                  value={editSoldPrice}
                  onChange={(e) => setEditSoldPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Remarks / Notes */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Remarks / Warranty Notes</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional warranty terms, trade-in notes, or accessories provided"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={resetEditEntryForm}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingFullEntry(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes to Entry</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Invoice Printable Area */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-200 print:text-slate-900 text-xs print:text-[11px] print:p-6" id="printable-invoice">
          
          {/* Shop Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-700 print:border-slate-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-slate-950 uppercase">
                  {settings.shopName}
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 font-medium mt-0.5">{settings.tagline}</p>
              
              <div className="mt-2 text-slate-300 print:text-slate-600 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 print:text-slate-400 shrink-0" />
                  <span>{settings.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500 print:text-slate-400" /> {settings.phone}
                  </span>
                  {settings.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500 print:text-slate-400" /> {settings.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-left sm:text-right bg-[#171B26] print:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-800 sm:border-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-slate-500 block">
                OFFICIAL SALES RECEIPT
              </span>
              <span className="font-mono text-base font-black text-white print:text-slate-900 block mt-0.5">
                {invoice.invoiceNumber}
              </span>
              <div className="mt-1">
                <span className="text-xs text-slate-300 print:text-slate-600 block">
                  Date: <strong>{new Date(invoice.saleDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                </span>

                {isEditingSaleDate ? (
                  <div className="print:hidden mt-1.5 flex items-center sm:justify-end gap-1.5 flex-wrap bg-slate-900/95 p-1.5 rounded-lg border border-blue-500/50 text-xs">
                    <span className="text-slate-300 text-[11px] font-semibold">Change Date:</span>
                    <input
                      type="date"
                      value={tempSaleDate}
                      onChange={(e) => setTempSaleDate(e.target.value)}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-xs text-white outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setTempSaleDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSaleDate}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded cursor-pointer transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingSaleDate(false)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="print:hidden flex items-center sm:justify-end gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTempSaleDate(invoice.saleDate ? invoice.saleDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                        setIsEditingSaleDate(true);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                      title="Edit saved invoice sale date in future"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Date</span>
                    </button>
                    {dateSuccess && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/60">
                        ✓ Date updated
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400 print:text-slate-500 block">
                Cashier / Staff: <strong>{invoice.soldBy}</strong>
              </span>
            </div>
          </div>

          {/* Customer & Device Meta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Customer Box */}
            <div className="bg-[#171B26] border border-slate-700/60 print:bg-slate-50 print:border-slate-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-500 block mb-1.5">
                Billed To (Customer Details)
              </span>
              <span className="font-bold text-sm text-white print:text-slate-900 block">{invoice.customer.name}</span>
              <div className="text-slate-300 print:text-slate-600 space-y-0.5 mt-1 text-xs">
                <div>Phone: <strong className="text-white print:text-slate-900">{invoice.customer.phone}</strong></div>
                {invoice.customer.cnicOrGovId && (
                  <div>Govt ID / CNIC: <strong className="font-mono text-cyan-300 print:text-slate-900">{invoice.customer.cnicOrGovId}</strong></div>
                )}
                {invoice.customer.address && (
                  <div>Address: {invoice.customer.address}</div>
                )}
              </div>
            </div>

            {/* Warranty Certificate Box */}
            <div className="bg-blue-950/40 border border-blue-800/60 print:bg-blue-50/70 print:border-blue-200 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 print:text-blue-900 block mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 print:text-blue-700" /> Warranty Certificate
              </span>
              <div className="text-slate-200 print:text-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Coverage Type:</span>
                  <span className="font-bold text-blue-300 print:text-blue-900">{invoice.warranty.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Duration:</span>
                  <span className="font-semibold text-white print:text-slate-900">{invoice.warranty.durationDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Valid Until:</span>
                  <span className="font-bold text-emerald-400 print:text-emerald-700">
                    {new Date(invoice.warranty.warrantyExpiry).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Itemized Table */}
          <div className="border border-slate-700/60 print:border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0D14] print:bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Item Description & Specifications</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-xs">
                <tr className="bg-[#12151E] print:bg-white">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white print:text-slate-900 text-sm block">
                      {invoice.deviceTitle}
                    </span>
                    <div className="mt-1 font-mono text-[11px] text-slate-400 print:text-slate-600 flex flex-wrap gap-x-4 gap-y-0.5">
                      <span>IMEI 1: <strong className="text-cyan-300 print:text-slate-900 font-bold">{invoice.imei1}</strong></span>
                      {invoice.imei2 && <span>IMEI 2: <strong className="text-cyan-400 print:text-slate-800">{invoice.imei2}</strong></span>}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${invoice.deviceType === 'new' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 print:bg-emerald-100 print:text-emerald-800' : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 print:bg-indigo-100 print:text-indigo-800'}`}>
                      {invoice.deviceType === 'new' ? 'Brand New' : 'Used / Pre-Owned'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white print:text-slate-900 text-sm">
                    {formatCurrency(invoice.soldPrice)}
                  </td>
                </tr>

                {/* Trade-in Row if applicable */}
                {invoice.tradeInItem && (
                  <tr className="bg-indigo-950/30 print:bg-indigo-50/50">
                    <td className="py-2.5 px-3" colSpan={2}>
                      <span className="font-semibold text-indigo-300 print:text-indigo-950 block">
                        Trade-In Exchange Credit: {invoice.tradeInItem.brand} {invoice.tradeInItem.model} ({invoice.tradeInItem.conditionGrade})
                      </span>
                      <span className="text-[11px] font-mono text-indigo-400 print:text-indigo-700">
                        Trade-In IMEI: {invoice.tradeInItem.imei}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400 print:text-rose-600">
                      -{formatCurrency(invoice.tradeInItem.agreedValue)}
                    </td>
                  </tr>
                )}

                {/* Discount row if applicable */}
                {invoice.discount > 0 && (
                  <tr className="bg-[#171B26] print:bg-slate-50">
                    <td className="py-2 px-3 text-slate-300 print:text-slate-600" colSpan={2}>Special Discount / Concession</td>
                    <td className="py-2 px-3 text-right font-semibold text-rose-400 print:text-rose-600">
                      -{formatCurrency(invoice.discount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Method Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#171B26] print:bg-slate-50 p-4 rounded-xl border border-slate-700/60 print:border-slate-200 gap-3">
            <div>
              <span className="text-slate-400 print:text-slate-500 text-[11px] block">Payment Method</span>
              <span className="font-bold text-white print:text-slate-900 text-sm">{invoice.paymentMethod}</span>
              {invoice.notes && (
                <span className="text-slate-400 print:text-slate-500 text-[11px] block mt-0.5">Remarks: {invoice.notes}</span>
              )}
            </div>

            <div className="text-right sm:min-w-[200px] space-y-1">
              <div className="flex justify-between text-slate-300 print:text-slate-600 text-xs">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.soldPrice)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-400 print:text-rose-600 text-xs">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tradeInItem && (
                <div className="flex justify-between text-indigo-400 print:text-indigo-600 text-xs">
                  <span>Trade-In Deduction:</span>
                  <span>-{formatCurrency(invoice.tradeInItem.agreedValue)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 print:border-slate-300 pt-1.5 text-white print:text-slate-950 font-black text-base">
                <span>Total Paid:</span>
                <span className="text-emerald-400 print:text-emerald-700">{formatCurrency(invoice.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Warranty Clause */}
          <div className="border-t border-slate-800 print:border-slate-200 pt-3 text-[10px] text-slate-400 print:text-slate-600 space-y-1">
            <span className="font-bold text-slate-300 print:text-slate-900 uppercase tracking-wider block">
              Terms & Conditions:
            </span>
            <p className="whitespace-pre-line leading-relaxed text-slate-400 print:text-slate-500">
              {settings.defaultInvoiceTerms}
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end text-center text-xs text-slate-400 print:text-slate-600">
            <div className="w-40 border-t border-slate-700 print:border-slate-400 pt-1">
              <span className="block font-medium">Customer Signature</span>
            </div>
            <div className="w-40 border-t border-slate-700 print:border-slate-400 pt-1">
              <span className="block font-medium">Authorized Shop Stamp</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
