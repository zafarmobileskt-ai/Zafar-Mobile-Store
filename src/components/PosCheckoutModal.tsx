import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { MobileItem, ConditionGrade } from '../types/mobile';
import confetti from 'canvas-confetti';
import { 
  X, 
  ShoppingBag, 
  User, 
  ShieldCheck, 
  ArrowLeftRight, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  Receipt,
  Smartphone,
  Sparkles,
  Percent,
  Camera,
  Barcode,
  BookOpen,
  Calendar,
  Wallet,
  Search,
  RotateCcw
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const PosCheckoutModal: React.FC = () => {
  const { 
    isPosModalOpen, 
    setIsPosModalOpen, 
    inventory, 
    selectedDeviceForSale, 
    setSelectedDeviceForSale,
    recordSale,
    setSelectedInvoiceForModal,
    formatCurrency,
    settings,
    customers
  } = useShop();

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const inStockDevices = inventory.filter((d) => d.status === 'in_stock');
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Sale details
  const [soldPrice, setSoldPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Split Payment' | 'Trade-In Balance'>('Cash');
  const [soldBy, setSoldBy] = useState<string>(settings.ownerName || 'Staff');
  const [notes, setNotes] = useState<string>('');

  // Credit / Khata options
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'credit'>('full');
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [creditDueDate, setCreditDueDate] = useState<string>('');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Warranty
  const [warrantyType, setWarrantyType] = useState<'Shop Checking Warranty' | 'Official Brand Warranty' | 'No Warranty' | 'Extended Dealer Warranty'>('Shop Checking Warranty');
  const [warrantyDays, setWarrantyDays] = useState<number>(settings.defaultWarrantyDaysUsed || 14);

  // Trade In
  const [isTradeIn, setIsTradeIn] = useState<boolean>(false);
  const [tradeInBrand, setTradeInBrand] = useState('Apple');
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInStorage, setTradeInStorage] = useState('128GB');
  const [tradeInImei, setTradeInImei] = useState('');
  const [tradeInCondition, setTradeInCondition] = useState<ConditionGrade>('Grade A (Minor Wear)');
  const [tradeInValue, setTradeInValue] = useState<number>(0);
  const [tradeInBattery, setTradeInBattery] = useState<number>(85);

  // Helper to reset customer & sale form to clean state (avoids carrying over old data)
  const resetSaleForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCnic('');
    setCustomerEmail('');
    setCustomerAddress('');
    setClientSearchQuery('');
    setIsSearchingClient(false);
    setDiscount(0);
    setPaymentMethod('Cash');
    setPaymentType('full');
    setCreditDueDate('');
    setNotes('');
    setIsTradeIn(false);
    setTradeInModel('');
    setTradeInImei('');
    setTradeInValue(0);
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  // When selectedDeviceForSale changes or modal opens
  useEffect(() => {
    if (selectedDeviceForSale) {
      setSelectedDeviceId(selectedDeviceForSale.id);
      setSoldPrice(selectedDeviceForSale.sellingPriceTarget);
      setAmountPaidNow(selectedDeviceForSale.sellingPriceTarget);
      if (selectedDeviceForSale.deviceType === 'new') {
        setWarrantyType('Official Brand Warranty');
        setWarrantyDays(settings.defaultWarrantyDaysNew || 365);
      } else {
        setWarrantyType('Shop Checking Warranty');
        setWarrantyDays(settings.defaultWarrantyDaysUsed || 14);
      }
    } else if (inStockDevices.length > 0 && !selectedDeviceId) {
      const first = inStockDevices[0];
      setSelectedDeviceId(first.id);
      setSoldPrice(first.sellingPriceTarget);
      setAmountPaidNow(first.sellingPriceTarget);
      setWarrantyDays(first.deviceType === 'new' ? settings.defaultWarrantyDaysNew : settings.defaultWarrantyDaysUsed);
    }
  }, [selectedDeviceForSale, isPosModalOpen]);

  const activeDevice = inventory.find((d) => d.id === selectedDeviceId);

  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    const dev = inventory.find((d) => d.id === devId);
    if (dev) {
      setSoldPrice(dev.sellingPriceTarget);
      setAmountPaidNow(dev.sellingPriceTarget);
      if (dev.deviceType === 'new') {
        setWarrantyType('Official Brand Warranty');
        setWarrantyDays(settings.defaultWarrantyDaysNew || 365);
      } else {
        setWarrantyType('Shop Checking Warranty');
        setWarrantyDays(settings.defaultWarrantyDaysUsed || 14);
      }
    }
  };

  if (!isPosModalOpen) return null;

  const tradeInDeduction = isTradeIn ? Number(tradeInValue || 0) : 0;
  const netPayable = Math.max(0, Number(soldPrice || 0) - Number(discount || 0) - tradeInDeduction);
  const cost = activeDevice?.purchaseCost || 0;
  const profit = Number(soldPrice || 0) - Number(discount || 0) - cost;

  // Remaining debt if credit/partial
  const unpaidDebt = paymentType === 'full' 
    ? 0 
    : paymentType === 'credit' 
    ? netPayable 
    : Math.max(0, netPayable - Number(amountPaidNow || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice) {
      alert('Please select a device in stock to sell.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Customer Name and Phone Number are required for the invoice & warranty.');
      return;
    }
    if (isTradeIn && !tradeInImei.trim()) {
      alert('Please enter the IMEI of the trade-in phone for legal compliance.');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(warrantyDays));

    const sale = recordSale({
      deviceId: activeDevice.id,
      soldPrice: Number(soldPrice),
      discount: Number(discount),
      paymentMethod: paymentType === 'credit' ? 'Credit' : paymentMethod,
      saleDate: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        cnicOrGovId: customerCnic.trim() || undefined,
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
      },
      warranty: {
        type: warrantyType,
        durationDays: Number(warrantyDays),
        warrantyExpiry: expiryDate.toISOString(),
        terms: `${warrantyDays} days ${warrantyType}. Hardware inspection & testing only. Physical/liquid damage not covered.`,
      },
      tradeInItem: isTradeIn && tradeInModel ? {
        brand: tradeInBrand,
        model: tradeInModel,
        storage: tradeInStorage,
        imei: tradeInImei,
        conditionGrade: tradeInCondition,
        agreedValue: Number(tradeInValue),
        batteryHealth: Number(tradeInBattery),
      } : undefined,
      soldBy,
      notes: notes.trim() || undefined,
      paymentType,
      amountPaidNow: paymentType === 'full' ? netPayable : paymentType === 'credit' ? 0 : Number(amountPaidNow || 0),
      creditDueDate: unpaidDebt > 0 && creditDueDate ? new Date(creditDueDate).toISOString() : undefined,
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {}

    // Reset customer and sale form so subsequent checkouts never display old data
    resetSaleForm();

    // Close checkout and immediately open the printable invoice modal
    setIsPosModalOpen(false);
    setSelectedDeviceForSale(null);
    setSelectedInvoiceForModal(sale);
  };

  const handleClose = () => {
    resetSaleForm();
    setIsPosModalOpen(false);
    setSelectedDeviceForSale(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#12151E] rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800">
        
        {/* Header */}
        <div className="bg-[#0B0D14] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Point of Sale (POS) & Checkout</h2>
              <p className="text-xs text-slate-400">Generate customer invoice, handle cash / Udhar Khata & process trade-in</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[80vh] overflow-y-auto space-y-4 text-xs text-slate-200">
          
          {/* Section 1: Device Selection from Stock */}
          <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-2.5">
            <label className="block font-bold text-white uppercase tracking-wider text-[11px]">
              1. Select Mobile from In-Stock Inventory *
            </label>

            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#12151E] border border-slate-700 rounded-lg font-medium text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            >
              {inStockDevices.length === 0 ? (
                <option value="">No devices currently in stock!</option>
              ) : (
                inStockDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.deviceType === 'new' ? 'BRAND NEW' : 'USED'}] {d.brand} {d.model} ({d.storage}) - {d.color} | IMEI: {d.imei1} | Target: {formatCurrency(d.sellingPriceTarget)}
                  </option>
                ))
              )}
            </select>

            {activeDevice && (
              <div className="p-3 bg-[#12151E] rounded-lg border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white text-sm">
                    {activeDevice.brand} {activeDevice.model}
                  </span>
                  <span className="text-slate-400 block text-[11px]">
                    IMEI: <strong className="font-mono text-cyan-300">{activeDevice.imei1}</strong> | {activeDevice.storage} | {activeDevice.color}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Purchase Cost</span>
                    <span className="font-semibold text-slate-300">{formatCurrency(activeDevice.purchaseCost)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block">Target Price</span>
                    <span className="font-bold text-emerald-400 text-sm">{formatCurrency(activeDevice.sellingPriceTarget)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pricing, Discount & Margin */}
          <div className="bg-[#0E1B17] p-4 rounded-xl border border-emerald-900/60 space-y-3">
            <h3 className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
              2. Selling Price, Date & Khata Terms ({settings.currencySymbol})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sale Date *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSaleDate(new Date().toISOString().split('T')[0])}
                    className="text-[9px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#08130F] border border-emerald-700/60 rounded-lg text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sale Price / Agreed Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">{settings.currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-emerald-700/60 rounded-lg font-bold text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Discount Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">{settings.currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-slate-700 rounded-lg text-xs font-semibold text-rose-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Payment Term (Khata)</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#08130F] border border-slate-700 rounded-lg text-xs text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="full">Full Payment Paid Now</option>
                  <option value="partial">Partial Payment (Remaining Udhar/Khata)</option>
                  <option value="credit">100% Credit Sale (Full Udhar / Lene Hain)</option>
                </select>
              </div>
            </div>

            {/* Split / Partial payment details */}
            {paymentType === 'partial' && (
              <div className="p-3 bg-[#08130F] rounded-lg border border-amber-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 mb-1">Paid In Advance Now ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-md font-bold text-xs text-emerald-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-400 mb-1">Remaining Udhar Balance</label>
                  <div className="px-2.5 py-1.5 bg-slate-900 border border-amber-700/60 rounded-md font-bold text-xs text-amber-300">
                    {formatCurrency(unpaidDebt)}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Expected Due Date</label>
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white"
                  />
                </div>
              </div>
            )}

            {paymentType === 'credit' && (
              <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
                <div>
                  <span className="font-bold text-amber-300 text-xs">Full Amount {formatCurrency(netPayable)} added to Customer Khata</span>
                  <span className="text-[10px] text-amber-400/80 block">Customer will owe this full amount. A debit entry will be created automatically.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-300">Due Date:</span>
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Payment Method / Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#08130F] border border-slate-700 rounded-lg text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Cash">Cash on Counter</option>
                  <option value="Debit/Credit Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                  <option value="Split Payment">Split Payment (Cash + Card)</option>
                  <option value="Trade-In Balance">Trade-In Balance</option>
                </select>
              </div>

              {/* Live Profit Preview */}
              <div className="bg-[#08130F] p-2.5 rounded-lg border border-emerald-900/60 flex items-center justify-between text-xs self-end">
                <span className="text-slate-300">
                  Cost: <strong>{formatCurrency(cost)}</strong>
                </span>
                <span className="font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                  Est Profit: +{formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Trade-In / Exchange Option */}
          <div className="bg-[#151426] p-4 rounded-xl border border-indigo-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTradeIn}
                  onChange={(e) => setIsTradeIn(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" /> Customer Trade-In / Exchange (Old Phone)
                </span>
              </label>
              {isTradeIn && (
                <span className="text-[11px] text-indigo-400 font-medium">
                  Auto-adds to Used Inventory
                </span>
              )}
            </div>

            {isTradeIn && (
              <div className="space-y-3 pt-2 border-t border-indigo-900/40 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">Old Phone Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple / Samsung"
                      value={tradeInBrand}
                      onChange={(e) => setTradeInBrand(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0F0E1D] border border-indigo-900/80 rounded-md text-xs text-white"
                      required={isTradeIn}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-300 mb-1">Old Phone Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 13 Pro"
                      value={tradeInModel}
                      onChange={(e) => setTradeInModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0F0E1D] border border-indigo-900/80 rounded-md text-xs font-semibold text-white"
                      required={isTradeIn}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-medium text-slate-300">Trade-in IMEI *</label>
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>Scan</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="15-digit IMEI"
                        value={tradeInImei}
                        onChange={(e) => setTradeInImei(e.target.value)}
                        className="w-full pl-2.5 pr-7 py-1.5 bg-[#0F0E1D] border border-indigo-900/80 rounded-md font-mono text-xs text-cyan-300"
                        required={isTradeIn}
                      />
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        title="Scan IMEI Barcode"
                        className="absolute right-2 top-1.5 text-cyan-400 hover:text-cyan-200 cursor-pointer"
                      >
                        <Barcode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-300 mb-1">Exchange Credit Value *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold">{settings.currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={tradeInValue}
                        onChange={(e) => setTradeInValue(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-[#0F0E1D] border border-indigo-700/60 rounded-md text-xs font-bold text-indigo-300"
                        required={isTradeIn}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Customer Details & Anti-Theft Verification */}
          <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> 3. Customer Information (For Invoice & Khata)
              </h3>
              
              {/* Existing Customer Search & Quick Add */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchingClient(!isSearchingClient)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>{isSearchingClient ? 'Close Search' : 'Find Contact'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerCnic('');
                    setCustomerEmail('');
                    setCustomerAddress('');
                    setIsSearchingClient(false);
                    setClientSearchQuery('');
                  }}
                  className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  + New Customer
                </button>
              </div>
            </div>

            {/* Inline Search Popup */}
            {isSearchingClient && (
              <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-lg space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type name or phone to search contacts..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                {clientSearchQuery.trim() ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {customers
                      .filter((c) => 
                        c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                        c.phone?.includes(clientSearchQuery.trim())
                      )
                      .slice(0, 4)
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setCustomerCnic(c.cnicOrGovId || '');
                            setCustomerEmail(c.email || '');
                            setCustomerAddress(c.address || '');
                            setIsSearchingClient(false);
                            setClientSearchQuery('');
                          }}
                          className="px-2.5 py-1.5 bg-slate-950/70 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-600/50 rounded-md flex items-center justify-between cursor-pointer text-xs transition-colors"
                        >
                          <span className="font-semibold text-slate-200">{c.name}</span>
                          <span className="text-slate-400 text-[11px]">{c.phone}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 text-center py-0.5">
                    Type a name or phone number to search without flooding all contacts.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">CNIC / Driving License / Gov ID</label>
                <input
                  type="text"
                  placeholder="e.g. ID-89421-A"
                  value={customerCnic}
                  onChange={(e) => setCustomerCnic(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Physical / Home Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Street 4, City"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Warranty Period & Expiry */}
          <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> 4. Warranty Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Warranty Type</label>
                <select
                  value={warrantyType}
                  onChange={(e) => setWarrantyType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Shop Checking Warranty">Shop Checking Warranty (Used Mobiles)</option>
                  <option value="Official Brand Warranty">Official Brand Warranty (1 Year / Brand New)</option>
                  <option value="Extended Dealer Warranty">Extended Dealer Warranty</option>
                  <option value="No Warranty">As-Is / No Warranty</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Warranty Duration (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#12151E] border border-slate-700 rounded-lg text-xs text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Final Net Payable Summary Banner */}
          <div className="bg-[#0B0D14] text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Total Net Amount Payable:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{formatCurrency(netPayable)}</span>
                {unpaidDebt > 0 && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                    Khata Debt: {formatCurrency(unpaidDebt)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetSaleForm}
                className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset customer & sale inputs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#171B26] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-complete-sale"
                type="submit"
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Complete Sale & Print Invoice</span>
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Barcode Scanner for Trade-in */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Trade-In Phone IMEI Barcode"
        subtitle="Point camera at customer's old phone box, back sticker, or type *#06# on the phone keypad to scan IMEI barcode."
        onScanSuccess={(scannedCode) => {
          setTradeInImei(scannedCode);
        }}
      />
    </div>
  );
};
