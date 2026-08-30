import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  DeviceType, 
  ConditionGrade, 
  NetworkStatus, 
  ScreenCondition, 
  DiagnosticChecklist 
} from '../types/mobile';
import { 
  X, 
  PlusCircle, 
  Smartphone, 
  Sparkles, 
  User, 
  DollarSign, 
  QrCode, 
  Camera, 
  Barcode,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Check,
  ShieldCheck
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const AddDeviceModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addMobile, settings, formatCurrency } = useShop();

  // Core Essential Fields
  const [deviceType, setDeviceType] = useState<DeviceType>('new');
  const [phoneName, setPhoneName] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [imei1, setImei1] = useState('');
  
  // Purchaser / Seller Info & Pricing
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserFatherName, setPurchaserFatherName] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [purchaserCnic, setPurchaserCnic] = useState('');
  const [purchaserAddress, setPurchaserAddress] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [policeRecordCheck, setPoliceRecordCheck] = useState(true);
  const [affidavitSigned, setAffidavitSigned] = useState(true);
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [sellingPriceTarget, setSellingPriceTarget] = useState<number | ''>('');

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'imei' | 'cnic'>('imei');

  // Optional Advanced Details Accordion
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [imei2, setImei2] = useState('');
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>('Grade A+ (Flawless)');
  const [batteryHealth, setBatteryHealth] = useState<number | ''>(90);
  const [screenCondition, setScreenCondition] = useState<ScreenCondition>('Original Pristine');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('PTA Approved');
  const [notes, setNotes] = useState('');

  if (!isAddModalOpen) return null;

  const popularBrands = [
    'Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'OnePlus', 'Realme', 'Infinix', 'Tecno', 'Google', 'Other'
  ];

  const popularStorages = ['64GB', '128GB', '256GB', '512GB', '1TB'];

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    if (!phoneName || popularBrands.some(b => phoneName === b)) {
      setPhoneName(selectedBrand === 'Other' ? '' : `${selectedBrand} `);
    }
  };

  const generateRandomImei = () => {
    let result = '35';
    for (let i = 0; i < 13; i++) {
      result += Math.floor(Math.random() * 10);
    }
    setImei1(result);
  };

  const generateDemoCnic = () => {
    const p1 = Math.floor(10000 + Math.random() * 90000);
    const p2 = Math.floor(1000000 + Math.random() * 9000000);
    const p3 = Math.floor(1 + Math.random() * 9);
    setPurchaserCnic(`${p1}-${p2}-${p3}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneName.trim()) {
      alert('Please enter the Phone Name / Model (e.g. iPhone 15 Pro, Samsung S24).');
      return;
    }
    if (!imei1.trim()) {
      alert('IMEI number is required for device identification and inventory tracking.');
      return;
    }

    const cost = Number(purchaseCost) || 0;
    const targetPrice = Number(sellingPriceTarget) || (cost > 0 ? Math.round(cost * 1.2) : 0);

    // Detect brand from phone name if possible
    let detectedBrand = brand;
    const lowerName = phoneName.toLowerCase();
    if (lowerName.includes('iphone') || lowerName.includes('apple')) detectedBrand = 'Apple';
    else if (lowerName.includes('samsung') || lowerName.includes('galaxy')) detectedBrand = 'Samsung';
    else if (lowerName.includes('redmi') || lowerName.includes('xiaomi') || lowerName.includes('poco')) detectedBrand = 'Xiaomi';
    else if (lowerName.includes('vivo')) detectedBrand = 'Vivo';
    else if (lowerName.includes('oppo')) detectedBrand = 'Oppo';
    else if (lowerName.includes('oneplus')) detectedBrand = 'OnePlus';
    else if (lowerName.includes('realme')) detectedBrand = 'Realme';
    else if (lowerName.includes('infinix')) detectedBrand = 'Infinix';
    else if (lowerName.includes('tecno')) detectedBrand = 'Tecno';
    else if (lowerName.includes('pixel') || lowerName.includes('google')) detectedBrand = 'Google';

    addMobile({
      deviceType,
      brand: detectedBrand,
      model: phoneName.trim(),
      storage,
      color: color.trim() || 'Standard',
      imei1: imei1.trim(),
      imei2: imei2.trim() || undefined,
      conditionGrade: deviceType === 'new' ? 'Brand New (Box Pack)' : conditionGrade,
      batteryHealth: deviceType === 'used' && batteryHealth !== '' ? Number(batteryHealth) : undefined,
      screenCondition: deviceType === 'used' ? screenCondition : undefined,
      accessories: deviceType === 'new' ? ['Original Box', 'Original Charger / Adapter', 'USB Cable'] : ['Original Box', 'USB Cable'],
      networkStatus,
      purchaseCost: cost,
      sellingPriceTarget: targetPrice,
      minPrice: cost > 0 ? Math.round(cost * 1.05) : targetPrice,
      purchaseDate: new Date().toISOString(),
      supplierOrSeller: {
        name: purchaserName.trim() || (deviceType === 'new' ? 'Distributor / Supplier' : 'Walk-in Customer'),
        fatherName: purchaserFatherName.trim() || undefined,
        phone: purchaserPhone.trim(),
        cnicOrGovId: purchaserCnic.trim() || undefined,
        address: purchaserAddress.trim() || undefined,
        type: deviceType === 'new' ? 'Distributor' : 'Walk-in Customer',
      },
      policeProtection: deviceType === 'used' || purchaserCnic.trim() ? {
        verificationStatus: policeRecordCheck ? 'verified' : 'pending',
        policeRecordCheck,
        idCardFrontUploaded: !!purchaserCnic.trim(),
        idCardNumber: purchaserCnic.trim() || undefined,
        sellerFatherName: purchaserFatherName.trim() || undefined,
        sellerCityAddress: purchaserAddress.trim() || undefined,
        policeStationJurisdiction: policeStation.trim() || 'Local District Police Station',
        affidavitSigned,
        sellerThumbprintCaptured: true,
        verifiedByOfficerOrStaff: settings.ownerName || 'Store Manager',
        verificationDate: new Date().toISOString(),
        notes: `Recorded on intake by ${settings.shopName}. Stolen check: ${policeRecordCheck ? 'Passed' : 'Pending'}.`
      } : undefined,
      status: 'in_stock',
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12151E] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-800 animate-in fade-in">
        
        {/* Header */}
        <div className="bg-[#0B0D14] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Mobile to Stock</h2>
              <p className="text-[11px] text-slate-400">Quick 4-step mobile entry form</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Short Form Container */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[82vh] overflow-y-auto space-y-4 text-xs text-slate-200">
          
          {/* 1. Used or New (Segmented Switcher) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Device Condition
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#0A0C13] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDeviceType('new')}
                className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  deviceType === 'new'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-[#171B26]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>📦 Brand New</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceType('used')}
                className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  deviceType === 'used'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-[#171B26]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✨ Used / Pre-Owned</span>
              </button>
            </div>
          </div>

          {/* 2. Phone Name */}
          <div className="bg-[#171B26] p-3.5 rounded-xl border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                2. Phone Name / Model *
              </label>
              <span className="text-[10px] text-slate-400">Quick Brand:</span>
            </div>

            {/* Quick Brand Pills */}
            <div className="flex flex-wrap gap-1.5">
              {popularBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandSelect(b)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                    brand === b
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                      : 'bg-[#10131B] text-slate-300 border-slate-700 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Phone Name Input */}
            <div>
              <input
                type="text"
                placeholder="e.g. iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Redmi Note 13..."
                value={phoneName}
                onChange={(e) => setPhoneName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0F1118] border border-slate-700 rounded-lg text-sm font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          {/* 3. IMEI Number */}
          <div className="bg-[#10192A] p-3.5 rounded-xl border border-blue-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                3. IMEI Number (15 Digits) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateRandomImei}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Demo IMEI
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. 358941098234512"
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 bg-[#0C1220] border border-blue-700/70 rounded-lg font-mono text-sm font-bold text-cyan-300 placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none tracking-wider"
                  required
                />
                <Barcode className="w-4 h-4 text-cyan-400/60 absolute right-2.5 top-3" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannerTarget('imei');
                  setIsScannerOpen(true);
                }}
                className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* 4. Purchaser / Seller Info & Pricing */}
          <div className="bg-[#171B26] p-3.5 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                4. {deviceType === 'new' ? 'Purchaser / Distributor Info & Price' : 'Seller (Customer) Info & Anti-Theft Record'}
              </label>
              {deviceType === 'used' && (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Police Protection
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {deviceType === 'new' ? 'Distributor / Supplier Name' : 'Seller (Customer) Name'}
                </label>
                <input
                  type="text"
                  placeholder={deviceType === 'new' ? 'e.g. City Tech Distributor' : 'e.g. Ali Khan'}
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={purchaserPhone}
                  onChange={(e) => setPurchaserPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* ID Card / CNIC & Father's Name (Essential for Used Mobiles / Police Record) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                    <span>ID Card / CNIC Number</span>
                    {deviceType === 'used' && <span className="text-[9px] text-amber-400/80 font-normal">(Police Req.)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={generateDemoCnic}
                    className="text-[9px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Demo ID
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. 42101-1234567-1 / DL-90821"
                      value={purchaserCnic}
                      onChange={(e) => setPurchaserCnic(e.target.value)}
                      className="w-full pl-2.5 pr-6 py-2 bg-[#10141D] border border-amber-800/60 rounded-lg font-mono text-xs text-amber-200 placeholder-slate-600 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <Barcode className="w-3.5 h-3.5 text-amber-400/50 absolute right-2 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerTarget('cnic');
                      setIsScannerOpen(true);
                    }}
                    title="Scan Barcode / QR on National ID card or Driver License"
                    className="px-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan ID</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Father's / Guardian Name {deviceType === 'used' && <span className="text-slate-500">(Optional)</span>}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Aslam"
                  value={purchaserFatherName}
                  onChange={(e) => setPurchaserFatherName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Address & Police Station (if used mobile) */}
            {deviceType === 'used' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Seller City / Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. House # 12, Street 4, City"
                    value={purchaserAddress}
                    onChange={(e) => setPurchaserAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Police Station Jurisdiction (Thana)</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Lines Police Station"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Police Compliance Checkboxes for Used Mobiles */}
            {deviceType === 'used' && (
              <div className="bg-[#0D1424] p-2.5 rounded-lg border border-blue-900/60 space-y-1.5 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={policeRecordCheck}
                    onChange={(e) => setPoliceRecordCheck(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                  />
                  <span>IMEI checked against police stolen / lost database (Clean & Safe)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={affidavitSigned}
                    onChange={(e) => setAffidavitSigned(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                  />
                  <span>Seller confirmed ownership affidavit & legal liability</span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-emerald-300 mb-1">
                  Purchase Cost / Buying Price ({settings.currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">{settings.currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={purchaseCost}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setPurchaseCost(val);
                      if (val !== '' && !sellingPriceTarget) {
                        setSellingPriceTarget(Math.round(Number(val) * 1.15));
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-emerald-700/60 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Target Selling Price ({settings.currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">{settings.currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 58000"
                    value={sellingPriceTarget}
                    onChange={(e) => setSellingPriceTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optional Extra Specs Toggle */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0A0C13]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>➕</span>
                <span>Optional Details (Storage, Color, CNIC, Battery Health)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-[#12151E]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Storage</label>
                    <select
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                    >
                      {popularStorages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Black, Blue"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">CNIC / ID #</label>
                    <input
                      type="text"
                      placeholder="e.g. 42101-..."
                      value={purchaserCnic}
                      onChange={(e) => setPurchaserCnic(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {deviceType === 'used' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Condition Grade</label>
                      <select
                        value={conditionGrade}
                        onChange={(e) => setConditionGrade(e.target.value as ConditionGrade)}
                        className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                      >
                        <option value="Grade A+ (Flawless)">Grade A+ (Flawless / 10/10)</option>
                        <option value="Grade A (Minor Wear)">Grade A (Minor Wear / 9/10)</option>
                        <option value="Grade B (Noticeable Scratches)">Grade B (8/10)</option>
                        <option value="Grade C (Heavy Scratches / Dents)">Grade C (7/10)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Battery Health %</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 88"
                        value={batteryHealth}
                        onChange={(e) => setBatteryHealth(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Any notes on warranty, accessories..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl font-medium text-slate-300 bg-[#171B26] hover:bg-[#1E2435] border border-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/40 transition-all cursor-pointer flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Save & Add Phone</span>
            </button>
          </div>

        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={scannerTarget === 'imei' ? "Scan IMEI Barcode / QR Code" : "Scan ID Card Barcode / CNIC QR Code"}
        subtitle={
          scannerTarget === 'imei'
            ? "Point camera at retail box sticker, back cover barcode, or dial pad (*#06#) to automatically capture IMEI."
            : "Point camera at the barcode or QR code on national identity card, driving license, or passport."
        }
        onScanSuccess={(scannedCode) => {
          if (scannerTarget === 'imei') {
            setImei1(scannedCode);
          } else {
            setPurchaserCnic(scannedCode);
          }
        }}
      />
    </div>
  );
};
