import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { MobileItem } from '../types/mobile';
import { 
  X, 
  Smartphone, 
  Battery, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Tag, 
  DollarSign, 
  Receipt, 
  FileText, 
  Hash, 
  Sparkles,
  Layers,
  ShoppingBag,
  Trash2,
  Edit,
  Printer
} from 'lucide-react';

export const DeviceDetailModal: React.FC = () => {
  const { 
    selectedDeviceForModal, 
    setSelectedDeviceForModal, 
    setSelectedPoliceCertDevice,
    formatCurrency, 
    deleteMobile, 
    updateMobile,
    updateMobileStatus,
    setIsPosModalOpen,
    setSelectedDeviceForSale,
    setDeviceToEdit,
    setIsAddModalOpen
  } = useShop();

  const [isEditingPurchaseDate, setIsEditingPurchaseDate] = useState(false);
  const [tempPurchaseDate, setTempPurchaseDate] = useState('');
  const [dateSaveSuccess, setDateSaveSuccess] = useState(false);

  if (!selectedDeviceForModal) return null;
  const item: MobileItem = selectedDeviceForModal;

  const handleSavePurchaseDate = () => {
    if (!tempPurchaseDate) return;
    const newIso = new Date(tempPurchaseDate).toISOString();
    updateMobile(item.id, { purchaseDate: newIso });
    setIsEditingPurchaseDate(false);
    setDateSaveSuccess(true);
    setTimeout(() => setDateSaveSuccess(false), 2500);
  };

  const handleSellNow = () => {
    setSelectedDeviceForSale(item);
    setSelectedDeviceForModal(null);
    setIsPosModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${item.brand} ${item.model} (${item.imei1}) from records?`)) {
      deleteMobile(item.id);
      setSelectedDeviceForModal(null);
    }
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return null;
    if (grade.includes('Brand New') || grade.includes('Open Box') || grade.includes('Grade A+')) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    }
    if (grade.includes('Grade A') || grade.includes('Grade B')) {
      return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
    }
    return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
  };

  const getBatteryBadgeColor = (health?: number) => {
    if (!health) return 'text-slate-400 bg-[#171B26] border border-slate-700';
    if (health >= 85) return 'text-emerald-300 bg-emerald-950/80 border-emerald-600/60';
    if (health >= 80) return 'text-amber-300 bg-amber-950/80 border-amber-600/60';
    return 'text-rose-300 bg-rose-950/80 border-rose-600/60';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#12151E] rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800">
        
        {/* Header */}
        <div className="bg-[#0B0D14] text-white px-5 py-4 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${item.deviceType === 'new' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${item.deviceType === 'new' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                  {item.deviceType === 'new' ? 'Brand New' : 'Pre-Owned (Used)'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  item.status === 'in_stock' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                  item.status === 'sold' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                  'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {item.status === 'in_stock' ? '● In Stock' : item.status === 'sold' ? '✓ Sold Out' : item.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {item.id}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {item.brand} {item.model}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDeviceToEdit(item);
                setIsAddModalOpen(true);
              }}
              className="text-slate-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Edit saved device entry details"
            >
              <Edit className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Edit Entry</span>
            </button>
            <button
              onClick={() => setSelectedDeviceForModal(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 text-slate-200 text-sm">
          
          {/* Key Quick Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#171B26] p-3.5 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs text-slate-400 block">Storage & RAM</span>
              <span className="font-semibold text-white">{item.storage} {item.ram ? `/ ${item.ram}` : ''}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Color</span>
              <span className="font-semibold text-white">{item.color}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Network / PTA</span>
              <span className="font-medium text-slate-300 text-xs truncate block" title={item.networkStatus}>
                {item.networkStatus}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Target Selling Price</span>
              <span className="font-bold text-emerald-400 text-base">{formatCurrency(item.sellingPriceTarget)}</span>
            </div>
          </div>

          {/* IMEI & Identification */}
          <div className="bg-[#10192A] p-4 rounded-xl border border-blue-900/60">
            <h3 className="text-xs font-bold uppercase text-blue-300 tracking-wider mb-2.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-400" /> Device Identifiers (IMEI & Serial)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0C1220] p-2.5 rounded-lg border border-blue-800/60">
                <span className="text-slate-400 block text-[11px]">Primary IMEI 1</span>
                <span className="font-mono font-bold text-cyan-300 tracking-wider text-sm select-all">
                  {item.imei1 || 'N/A'}
                </span>
              </div>
              {item.imei2 && (
                <div className="bg-[#0C1220] p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Secondary IMEI 2</span>
                  <span className="font-mono font-semibold text-slate-200 tracking-wider text-sm select-all">
                    {item.imei2}
                  </span>
                </div>
              )}
              {item.serialNumber && (
                <div className="bg-[#0C1220] p-2.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Serial Number</span>
                  <span className="font-mono font-semibold text-slate-200 tracking-wider select-all">
                    {item.serialNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Condition & Health (Especially for Used Mobiles) */}
          {item.deviceType === 'used' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Used Phone Condition & Health Report
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#171B26] p-3 rounded-xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Cosmetic Grade</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getGradeBadge(item.conditionGrade)}`}>
                    {item.conditionGrade || 'Standard'}
                  </span>
                </div>

                <div className="bg-[#171B26] p-3 rounded-xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Battery Health</span>
                  {item.batteryHealth ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBatteryBadgeColor(item.batteryHealth)}`}>
                      <Battery className="w-3.5 h-3.5" />
                      {item.batteryHealth}% Maximum Capacity
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Not Tested</span>
                  )}
                </div>

                <div className="bg-[#171B26] p-3 rounded-xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Screen / Display</span>
                  <span className="font-medium text-xs text-slate-200">
                    {item.screenCondition || 'Original Display'}
                  </span>
                </div>
              </div>

              {/* Hardware Diagnostic Checklist results */}
              {item.diagnostics && (
                <div className="bg-[#151426] p-3.5 rounded-xl border border-indigo-900/60">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    Hardware Diagnostic Check Results
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(item.diagnostics).map(([key, passed]) => {
                      const labels: Record<string, string> = {
                        touchScreen: 'Touch Screen',
                        faceIdOrFingerprint: 'Biometrics / Face ID',
                        frontCamera: 'Front Camera',
                        backCamera: 'Rear Camera & Zoom',
                        chargingPort: 'Charging Port',
                        speakersAndMic: 'Speakers & Mic',
                        wifiAndBluetooth: 'Wi-Fi & Bluetooth',
                        simAndNetworkCalling: 'SIM & Calling',
                        physicalButtons: 'Buttons & Keys',
                        wirelessCharging: 'Wireless Charging',
                        trueTone: 'TrueTone / Color',
                      };
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          {passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className={passed ? 'text-slate-300' : 'text-rose-300 font-medium'}>
                            {labels[key] || key}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Included Accessories */}
          <div>
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider block mb-1.5">
              Included Items / Accessories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.accessories && item.accessories.length > 0 ? (
                item.accessories.map((acc, idx) => (
                  <span key={idx} className="bg-[#171B26] text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700">
                    ✓ {acc}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Device Only</span>
              )}
            </div>
          </div>

          {/* Purchase & Financial Provenance */}
          <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Financial & Source Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Purchase Cost</span>
                <span className="font-semibold text-white text-sm">{formatCurrency(item.purchaseCost)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Min. Acceptable Price</span>
                <span className="font-semibold text-slate-300 text-sm">{formatCurrency(item.minPrice || item.purchaseCost)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Profit Margin</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  +{formatCurrency(item.sellingPriceTarget - item.purchaseCost)} ({Math.round(((item.sellingPriceTarget - item.purchaseCost) / (item.purchaseCost || 1)) * 100)}%)
                </span>
              </div>
            </div>

            {/* Source / Supplier Record */}
            <div className="border-t border-slate-700/60 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <span className="text-slate-400">Acquired from: </span>
                <span className="font-medium text-slate-200">{item.supplierOrSeller?.name || 'Walk-in'} ({item.supplierOrSeller?.type || 'Distributor'})</span>
                {item.supplierOrSeller?.cnicOrGovId && (
                  <span className="ml-2 font-mono text-slate-400">ID: {item.supplierOrSeller.cnicOrGovId}</span>
                )}
              </div>
              <div className="text-slate-400">
                {isEditingPurchaseDate ? (
                  <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/90 p-1.5 rounded-lg border border-blue-500/40">
                    <span className="text-[11px] text-slate-300 font-medium">Edit Date:</span>
                    <input
                      type="date"
                      value={tempPurchaseDate}
                      onChange={(e) => setTempPurchaseDate(e.target.value)}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-xs text-white outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setTempPurchaseDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePurchaseDate}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded cursor-pointer transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPurchaseDate(false)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Intake Date: </span>
                    <span className="font-semibold text-slate-200">
                      {new Date(item.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                        setIsEditingPurchaseDate(true);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded hover:bg-blue-950/40 cursor-pointer font-medium"
                      title="Edit saved purchase/intake date in future"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Date</span>
                    </button>
                    {dateSaveSuccess && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/60">
                        ✓ Date updated
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sale History if Sold */}
          {item.saleRecord && (
            <div className="bg-[#0E1B17] p-4 rounded-xl border border-emerald-900/60">
              <h3 className="text-xs font-bold uppercase text-emerald-300 tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" /> Sold Transaction Record
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Invoice #</span>
                  <span className="font-mono font-bold text-emerald-300">{item.saleRecord.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="font-semibold text-slate-200">{item.saleRecord.customer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sold Amount</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(item.saleRecord.finalAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Profit</span>
                  <span className="font-bold text-emerald-400">+{formatCurrency(item.saleRecord.profit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="bg-[#1C1A12] p-3 rounded-lg border border-amber-900/60 text-xs">
              <span className="font-semibold text-amber-300 block mb-0.5">Device Notes:</span>
              <p className="text-slate-300 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[#0B0D14] px-5 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/60 border border-rose-800/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Device</span>
            </button>
            {item.status !== 'in_stock' && (
              <button
                onClick={() => updateMobileStatus(item.id, 'in_stock')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#171B26] border border-slate-700 transition-colors cursor-pointer"
              >
                Mark as In-Stock
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDeviceToEdit(item);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 transition-colors cursor-pointer"
              title="Edit all specifications, pricing, IMEI, or purchase details"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Entry</span>
            </button>
            {item.policeProtection && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPoliceCertDevice(item);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Police Certificate</span>
              </button>
            )}
            <button
              onClick={() => setSelectedDeviceForModal(null)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-[#171B26] hover:bg-[#1E2435] border border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
            {item.status === 'in_stock' && (
              <button
                id="btn-sell-this-device"
                onClick={handleSellNow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sell Device (POS Checkout)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
