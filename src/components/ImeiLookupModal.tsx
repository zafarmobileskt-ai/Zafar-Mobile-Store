import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { MobileItem } from '../types/mobile';
import { 
  X, 
  Search, 
  Barcode, 
  Smartphone, 
  ShieldCheck, 
  Calendar, 
  User, 
  DollarSign, 
  Receipt,
  CheckCircle2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const ImeiLookupModal: React.FC = () => {
  const { 
    isImeiSearchOpen, 
    setIsImeiSearchOpen, 
    inventory, 
    formatCurrency, 
    setSelectedDeviceForModal, 
    setSelectedInvoiceForModal,
    customers,
    setSelectedCustomerForModal
  } = useShop();

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'all' | 'imei' | 'customer' | 'invoice'>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isImeiSearchOpen) return null;

  const cleaned = query.trim().toLowerCase();

  const matchedCustomers = cleaned
    ? customers
        .filter((c) => 
          c.name.toLowerCase().includes(cleaned) ||
          c.phone.toLowerCase().includes(cleaned) ||
          (c.email && c.email.toLowerCase().includes(cleaned)) ||
          (c.cnicOrGovId && c.cnicOrGovId.toLowerCase().includes(cleaned))
        )
        .filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx)
    : [];

  const matchedDevices = cleaned
    ? inventory.filter((item) => {
        if (searchMode === 'imei') {
          return (
            item.imei1?.toLowerCase().includes(cleaned) ||
            (item.imei2 && item.imei2.toLowerCase().includes(cleaned)) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(cleaned))
          );
        }

        if (searchMode === 'customer') {
          return (
            (item.saleRecord?.customer.name && item.saleRecord.customer.name.toLowerCase().includes(cleaned)) ||
            (item.saleRecord?.customer.phone && item.saleRecord.customer.phone.toLowerCase().includes(cleaned)) ||
            (item.saleRecord?.customer.cnicOrGovId && item.saleRecord.customer.cnicOrGovId.toLowerCase().includes(cleaned)) ||
            (item.supplierOrSeller?.name && item.supplierOrSeller.name.toLowerCase().includes(cleaned)) ||
            (item.supplierOrSeller?.phone && item.supplierOrSeller.phone.toLowerCase().includes(cleaned)) ||
            (item.supplierOrSeller?.cnicOrGovId && item.supplierOrSeller.cnicOrGovId.toLowerCase().includes(cleaned))
          );
        }

        if (searchMode === 'invoice') {
          return (
            (item.saleRecord?.invoiceNumber && item.saleRecord.invoiceNumber.toLowerCase().includes(cleaned)) ||
            item.id.toLowerCase().includes(cleaned)
          );
        }

        // 'all' search mode:
        return (
          item.imei1?.toLowerCase().includes(cleaned) ||
          (item.imei2 && item.imei2.toLowerCase().includes(cleaned)) ||
          (item.serialNumber && item.serialNumber.toLowerCase().includes(cleaned)) ||
          item.id.toLowerCase().includes(cleaned) ||
          `${item.brand} ${item.model}`.toLowerCase().includes(cleaned) ||
          (item.supplierOrSeller?.name && item.supplierOrSeller.name.toLowerCase().includes(cleaned)) ||
          (item.supplierOrSeller?.phone && item.supplierOrSeller.phone.toLowerCase().includes(cleaned)) ||
          (item.supplierOrSeller?.cnicOrGovId && item.supplierOrSeller.cnicOrGovId.toLowerCase().includes(cleaned)) ||
          (item.saleRecord?.customer.name && item.saleRecord.customer.name.toLowerCase().includes(cleaned)) ||
          (item.saleRecord?.customer.phone && item.saleRecord.customer.phone.toLowerCase().includes(cleaned)) ||
          (item.saleRecord?.customer.cnicOrGovId && item.saleRecord.customer.cnicOrGovId.toLowerCase().includes(cleaned)) ||
          (item.saleRecord?.invoiceNumber && item.saleRecord.invoiceNumber.toLowerCase().includes(cleaned))
        );
      })
    : [];

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'imei':
        return 'Search specifically by IMEI 1, IMEI 2, or Serial number...';
      case 'customer':
        return 'Search specifically by Customer Name, Phone, CNIC / ID...';
      case 'invoice':
        return 'Search specifically by Invoice # or Device ID...';
      default:
        return 'Search by IMEI, Customer Name, Phone, Model, or Invoice #...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#12151E] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800">
        
        {/* Header with Search Bar and Mode Switcher */}
        <div className="bg-[#0B0D14] text-white p-5 space-y-3.5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-base">Quick Device, IMEI & Customer Lookup</span>
            </div>
            <button
              onClick={() => setIsImeiSearchOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Mode Option Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0">Search By:</span>
            <button
              type="button"
              id="search-mode-all"
              onClick={() => setSearchMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                searchMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#171B26] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              All Fields
            </button>
            <button
              type="button"
              id="search-mode-imei"
              onClick={() => setSearchMode('imei')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                searchMode === 'imei'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-[#171B26] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Barcode className="w-3.5 h-3.5 text-cyan-400" />
              <span>IMEI / Serial</span>
            </button>
            <button
              type="button"
              id="search-mode-customer"
              onClick={() => setSearchMode('customer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                searchMode === 'customer'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#171B26] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Name</span>
            </button>
            <button
              type="button"
              id="search-mode-invoice"
              onClick={() => setSearchMode('invoice')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                searchMode === 'invoice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[#171B26] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-400" />
              <span>Invoice #</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                placeholder={getPlaceholder()}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#171B26] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 outline-none font-mono"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              id="btn-scan-imei-lookup"
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              title="Open Barcode Scanner"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 text-xs text-slate-200">
          {!cleaned ? (
            <div className="text-center py-8 text-slate-400">
              <Barcode className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="font-medium text-slate-300">Enter an IMEI, Serial Number or Customer Name to trace complete shop history</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Verify whether a phone was purchased from your shop, check warranty expiration, or inspect customer preferences
              </p>
            </div>
          ) : matchedDevices.length === 0 && matchedCustomers.length === 0 ? (
            <div className="text-center py-8 bg-amber-950/20 rounded-xl border border-amber-800/40">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="font-bold text-slate-200">No matching device or customer found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400 mt-1">
                This record is not found in your inventory, sales, or customer CRM database.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Matched Customer Profiles */}
              {matchedCustomers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    <span>Matched Customer CRM Profiles ({matchedCustomers.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomerForModal(cust);
                          setIsImeiSearchOpen(false);
                        }}
                        className="p-3 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.tags?.includes('VIP Buyer') && (
                              <span className="text-[10px] bg-amber-400 text-amber-950 px-1 rounded font-extrabold">VIP</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono">{cust.phone}</div>
                          {cust.preferences?.preferredBrands && cust.preferences.preferredBrands.length > 0 && (
                            <div className="text-[10px] text-indigo-300">
                              Prefers: {cust.preferences.preferredBrands.join(', ')}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                          View CRM →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Devices */}
              {matchedDevices.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="font-bold uppercase tracking-wider text-slate-300">Found {matchedDevices.length} Device Record(s)</span>
                  </div>

                  {matchedDevices.map((device) => {
                    const isSold = device.status === 'sold';
                    return (
                  <div
                    key={device.id}
                    className="p-4 bg-[#171B26] hover:bg-[#1C2130] rounded-xl border border-slate-700/60 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${device.deviceType === 'new' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'}`}>
                            {device.deviceType === 'new' ? 'Brand New' : 'Used Phone'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            device.status === 'in_stock' ? 'bg-emerald-600 text-white' :
                            device.status === 'sold' ? 'bg-slate-700 text-slate-300' : 'bg-amber-600 text-white'
                          }`}>
                            {device.status === 'in_stock' ? '● IN STOCK' : device.status === 'sold' ? '✓ SOLD' : device.status}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">ID: {device.id}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white mt-1">
                          {device.brand} {device.model} ({device.storage}) - {device.color}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Selling Target</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {formatCurrency(device.sellingPriceTarget)}
                        </span>
                      </div>
                    </div>

                    {/* IMEI Numbers */}
                    <div className="bg-[#12151E] p-2.5 rounded-lg border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Primary IMEI 1</span>
                        <span className="font-mono font-bold text-cyan-300 tracking-wider">
                          {device.imei1}
                        </span>
                      </div>
                      {device.imei2 && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Secondary IMEI 2</span>
                          <span className="font-mono font-medium text-cyan-400 tracking-wider">
                            {device.imei2}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* History Trace */}
                    <div className="text-[11px] text-slate-300 space-y-1 bg-[#12151E]/60 p-2.5 rounded-lg border border-slate-700/60">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Intake Source:</span>
                        <strong className="text-white">{device.supplierOrSeller?.name || 'Distributor'} ({device.supplierOrSeller?.type})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost / Purchase Price:</span>
                        <strong className="text-slate-200">{formatCurrency(device.purchaseCost)} on {new Date(device.purchaseDate).toLocaleDateString()}</strong>
                      </div>

                      {device.saleRecord && (
                        <div className="pt-1.5 border-t border-slate-800 space-y-1">
                          <div className="flex justify-between text-emerald-400">
                            <span className="font-semibold">Sold To Customer:</span>
                            <strong>{device.saleRecord.customer.name} ({device.saleRecord.customer.phone})</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Invoice Number:</span>
                            <strong className="font-mono text-slate-200">{device.saleRecord.invoiceNumber}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Warranty Expiry:</span>
                            <strong className="text-blue-400">
                              {new Date(device.saleRecord.warranty.warrantyExpiry).toLocaleDateString()} ({device.saleRecord.warranty.type})
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedDeviceForModal(device);
                          setIsImeiSearchOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg font-medium text-slate-200 bg-[#12151E] hover:bg-[#1f2433] border border-slate-700 transition-colors cursor-pointer"
                      >
                        View Full Specs
                      </button>

                      {device.saleRecord && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForModal(device.saleRecord!);
                            setIsImeiSearchOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg font-semibold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0B0D14] px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setIsImeiSearchOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-[#171B26] hover:bg-[#1f2433] border border-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan IMEI Barcode to Lookup Device"
        subtitle="Point camera at retail box sticker, device back, or dial pad (*#06#) to search inventory and sales records instantly."
        onScanSuccess={(scannedCode) => {
          setSearchMode('imei');
          setQuery(scannedCode);
        }}
      />
    </div>
  );
};
