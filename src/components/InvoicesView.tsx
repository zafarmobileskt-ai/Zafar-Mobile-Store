import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { SaleRecord } from '../types/mobile';
import { 
  ReceiptText, 
  Search, 
  ShieldCheck, 
  Calendar, 
  User, 
  Phone, 
  Eye, 
  Printer, 
  DollarSign, 
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Camera,
  Barcode,
  FileSpreadsheet,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const InvoicesView: React.FC = () => {
  const { 
    sales, 
    formatCurrency, 
    setSelectedInvoiceForModal, 
    settings, 
    setIsPosModalOpen,
    exportSalesToSheets,
    getCustomerByPhone,
    setSelectedCustomerForModal,
    updateSale,
    customers
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'customer' | 'imei' | 'invoice' | 'phone'>('all');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'all' | 'new' | 'used'>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingDateSaleId, setEditingDateSaleId] = useState<string | null>(null);
  const [tempDateValue, setTempDateValue] = useState<string>('');

  const now = new Date();

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Device Type
      if (deviceTypeFilter !== 'all' && sale.deviceType !== deviceTypeFilter) return false;

      // Warranty Filter
      if (warrantyFilter !== 'all') {
        const isExpired = new Date(sale.warranty.warrantyExpiry) < now;
        if (warrantyFilter === 'active' && isExpired) return false;
        if (warrantyFilter === 'expired' && !isExpired) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const custName = (sale.customer?.name || '').toLowerCase();
        const custPhone = (sale.customer?.phone || '').toLowerCase();
        const custCnic = (sale.customer?.cnicOrGovId || '').toLowerCase();
        const custFather = (sale.customer?.fatherName || '').toLowerCase();
        const custAddress = (sale.customer?.address || '').toLowerCase();
        const imei1 = (sale.imei1 || '').toLowerCase();
        const imei2 = (sale.imei2 || '').toLowerCase();
        const invoiceNum = (sale.invoiceNumber || '').toLowerCase();
        const devTitle = (sale.deviceTitle || '').toLowerCase();

        if (searchField === 'customer') {
          return custName.includes(q) || custCnic.includes(q) || custFather.includes(q) || custAddress.includes(q);
        }

        if (searchField === 'imei') {
          return imei1.includes(q) || imei2.includes(q);
        }

        if (searchField === 'invoice') {
          return invoiceNum.includes(q);
        }

        if (searchField === 'phone') {
          return custPhone.includes(q);
        }

        // 'all' search
        const matchInvoice = invoiceNum.includes(q);
        const matchTitle = devTitle.includes(q);
        const matchCustomer = custName.includes(q) || custFather.includes(q) || custAddress.includes(q);
        const matchPhone = custPhone.includes(q);
        const matchImei = imei1.includes(q) || imei2.includes(q);
        const matchCnic = custCnic.includes(q);
        if (!matchInvoice && !matchTitle && !matchCustomer && !matchPhone && !matchImei && !matchCnic) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, deviceTypeFilter, warrantyFilter, searchQuery, searchField, now]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.finalAmount, 0);
  }, [filteredSales]);

  const totalProfit = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.profit, 0);
  }, [filteredSales]);

  const getSearchPlaceholder = () => {
    switch (searchField) {
      case 'customer':
        return 'Search by Customer Name or CNIC/ID...';
      case 'imei':
        return 'Search by 15-digit IMEI number...';
      case 'invoice':
        return 'Search by Invoice Number...';
      case 'phone':
        return 'Search by Customer Phone Number...';
      default:
        return 'Search by Invoice #, Customer Name, Phone, IMEI or Model...';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Total Invoices</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{sales.length}</span>
              <span className="text-xs text-slate-400 font-medium">sales</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50 flex items-center justify-center">
            <ReceiptText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Total Billed Revenue</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Total Net Profit</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">+{formatCurrency(totalProfit)}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Combined Search with Field Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
            <div className="sm:w-44 shrink-0">
              <select
                id="select-invoice-search-field"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="w-full bg-[#171B26] border border-slate-700/70 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="all">🔍 All Fields</option>
                <option value="imei">📱 Search by IMEI</option>
                <option value="customer">👤 Search by Customer</option>
                <option value="invoice">🧾 Search by Invoice #</option>
                <option value="phone">📞 Search by Phone</option>
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-medium text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-[#1C2130] outline-none"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-cyan-400 hover:text-cyan-200 cursor-pointer"
                  title="Scan IMEI Barcode"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Device Type */}
            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value as any)}
              className="bg-[#171B26] border border-slate-700/70 rounded-lg px-3 py-2 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Devices (New & Used)</option>
              <option value="new">Brand New Only</option>
              <option value="used">Used Mobiles Only</option>
            </select>

            {/* Warranty Filter */}
            <select
              value={warrantyFilter}
              onChange={(e) => setWarrantyFilter(e.target.value as any)}
              className="bg-[#171B26] border border-slate-700/70 rounded-lg px-3 py-2 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Warranties</option>
              <option value="active">Active Warranty Only</option>
              <option value="expired">Expired Warranty</option>
            </select>

            {/* Export Invoices to Sheets */}
            <button
              type="button"
              onClick={() => exportSalesToSheets('xlsx')}
              className="px-3 py-2 bg-[#171B26] hover:bg-[#1E2435] text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-800/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export all sales invoices to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Invoices</span>
            </button>

            <button
              onClick={() => setIsPosModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              + New Sale
            </button>
          </div>

        </div>
      </div>

      {/* Invoices List */}
      {filteredSales.length === 0 ? (
        <div className="bg-[#12151E] p-12 text-center rounded-xl border border-slate-800/90 shadow-sm space-y-3">
          <ReceiptText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-bold text-base text-white">No invoices found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No sales match the search or filter criteria. Process a sale to generate an invoice.
          </p>
        </div>
      ) : (
        <div className="bg-[#12151E] rounded-xl border border-slate-800/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B0D14] text-slate-300 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <th className="py-3 px-3.5">Invoice # & Date</th>
                  <th className="py-3 px-3">Device & IMEI</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Warranty Status</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Net Profit</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSales.map((sale) => {
                  const isWarrantyExpired = new Date(sale.warranty.warrantyExpiry) < now;
                  return (
                    <tr key={sale.saleId} className="hover:bg-[#171B26]/80 transition-colors">
                      
                      {/* Invoice # & Date */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="font-mono font-bold text-blue-400 hover:text-blue-300 cursor-pointer text-xs"
                          >
                            {sale.invoiceNumber}
                          </span>
                        </div>
                        {editingDateSaleId === sale.saleId ? (
                          <div className="mt-1 flex items-center gap-1 bg-slate-900 p-1 rounded border border-blue-500/50">
                            <input
                              type="date"
                              value={tempDateValue}
                              onChange={(e) => setTempDateValue(e.target.value)}
                              className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-[11px] text-white outline-none focus:border-blue-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (tempDateValue) {
                                  updateSale(sale.saleId, { saleDate: new Date(tempDateValue).toISOString() });
                                }
                                setEditingDateSaleId(null);
                              }}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                              title="Save Date"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDateSaleId(null)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5 group">
                            <span className="text-[11px] text-slate-400 block">
                              {new Date(sale.saleDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTempDateValue(sale.saleDate ? sale.saleDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                                setEditingDateSaleId(sale.saleId);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-400 hover:text-blue-300 p-0.5 rounded transition-opacity cursor-pointer"
                              title="Edit saved sale date"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Device & IMEI */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${sale.deviceType === 'new' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'}`}>
                            {sale.deviceType === 'new' ? 'NEW' : 'USED'}
                          </span>
                          <span className="font-bold text-white">{sale.deviceTitle}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          IMEI: <span className="font-semibold text-cyan-300">{sale.imei1}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-3">
                        {(() => {
                          const linkedCust = (sale.customer?.phone ? getCustomerByPhone(sale.customer.phone) : undefined) ||
                            customers.find((c) => (c.name && sale.customer?.name && c.name.toLowerCase() === sale.customer.name.toLowerCase()));
                          const purchaserName = sale.customer?.name?.trim() || linkedCust?.name || 'Walk-in Customer';
                          const purchaserFatherName = sale.customer?.fatherName || linkedCust?.fatherName;
                          const purchaserPhone = sale.customer?.phone || linkedCust?.phone;
                          const purchaserCnic = sale.customer?.cnicOrGovId || linkedCust?.cnicOrGovId;
                          const purchaserAddress = sale.customer?.address || linkedCust?.address;

                          return (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (linkedCust) {
                                      setSelectedCustomerForModal(linkedCust);
                                    } else {
                                      setSelectedInvoiceForModal(sale);
                                    }
                                  }}
                                  className="font-semibold text-white hover:text-indigo-400 text-left transition-colors cursor-pointer block"
                                  title="View Customer CRM Profile & Past Purchases"
                                >
                                  {purchaserName}
                                </button>
                                {purchaserFatherName && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    (S/O {purchaserFatherName})
                                  </span>
                                )}
                              </div>

                              {purchaserPhone && (
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{purchaserPhone}</span>
                                </div>
                              )}

                              {purchaserCnic && (
                                <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                                  <span className="text-slate-500 text-[9px]">CNIC:</span>
                                  <span>{purchaserCnic}</span>
                                </div>
                              )}

                              {purchaserAddress && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[170px]" title={purchaserAddress}>
                                  {purchaserAddress}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Warranty Status */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            !isWarrantyExpired
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {!isWarrantyExpired ? 'Active Warranty' : 'Expired'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Expires: {new Date(sale.warranty.warrantyExpiry).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount Paid */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-white text-sm block">
                          {formatCurrency(sale.finalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* Net Profit */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-emerald-400 text-xs block">
                          +{formatCurrency(sale.profit)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Cost: {formatCurrency(sale.purchaseCost)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#171B26] hover:bg-[#1E2435] text-amber-300 hover:text-amber-200 border border-slate-700/60 hover:border-amber-500/50 transition-all cursor-pointer"
                            title="Edit invoice entry details, customer or date"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#171B26] hover:bg-[#1E2435] text-slate-200 hover:text-white border border-slate-700/60 hover:border-blue-500/50 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan IMEI Barcode to Filter Invoices"
        subtitle="Point camera at retail receipt or customer's device barcode to locate invoice record."
        onScanSuccess={(scannedCode) => {
          setSearchField('imei');
          setSearchQuery(scannedCode);
        }}
      />

    </div>
  );
};
