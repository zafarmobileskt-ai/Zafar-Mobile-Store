import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  DeviceType,
  ConditionGrade, 
  ScreenCondition, 
  NetworkStatus,
  MobileItem
} from '../types/mobile';
import { 
  Smartphone, 
  Sparkles, 
  User, 
  CheckCircle2, 
  Barcode, 
  FileCheck,
  Camera,
  QrCode,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Printer,
  FileText
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const BuyUsedMobileView: React.FC = () => {
  const { 
    recordUsedIntake, 
    settings, 
    setActiveTab, 
    setSelectedDeviceForModal,
    setSelectedPoliceCertDevice 
  } = useShop();

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'imei' | 'cnic'>('imei');

  // 1. Used or New
  const [deviceType, setDeviceType] = useState<DeviceType>('used');

  // 2. Phone Name & Brand
  const [phoneName, setPhoneName] = useState('');
  const [brand, setBrand] = useState('Apple');

  // 3. IMEI
  const [imei1, setImei1] = useState('');

  // 4. Purchaser / Seller Info & Pricing
  const [sellerName, setSellerName] = useState('');
  const [sellerFatherName, setSellerFatherName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerCnic, setSellerCnic] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [policeRecordCheck, setPoliceRecordCheck] = useState(true);
  const [affidavitSigned, setAffidavitSigned] = useState(true);
  const [agreedPurchasePrice, setAgreedPurchasePrice] = useState<number | ''>('');
  const [targetSellingPrice, setTargetSellingPrice] = useState<number | ''>('');

  // Optional Advanced Details
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [imei2, setImei2] = useState('');
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>('Grade A (Minor Wear)');
  const [batteryHealth, setBatteryHealth] = useState<number>(88);
  const [screenCondition, setScreenCondition] = useState<ScreenCondition>('Original Pristine');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('PTA Approved');
  const [notes, setNotes] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [recentlyAddedDevice, setRecentlyAddedDevice] = useState<MobileItem | null>(null);

  const popularBrands = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'OnePlus', 'Realme', 'Infinix', 'Tecno', 'Other'];
  const popularStorages = ['64GB', '128GB', '256GB', '512GB', '1TB'];

  const handleBrandSelect = (b: string) => {
    setBrand(b);
    if (!phoneName || popularBrands.some(brandName => phoneName === brandName)) {
      setPhoneName(b === 'Other' ? '' : `${b} `);
    }
  };

  const generateDemoImei = () => {
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
    setSellerCnic(`${p1}-${p2}-${p3}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneName.trim()) {
      alert('Please enter phone name/model.');
      return;
    }
    if (!imei1.trim()) {
      alert('Primary IMEI is required for device intake.');
      return;
    }

    const cost = Number(agreedPurchasePrice) || 0;
    const target = Number(targetSellingPrice) || (cost > 0 ? Math.round(cost * 1.2) : 0);

    // Auto-detect brand from name if needed
    let detectedBrand = brand;
    const lower = phoneName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('apple')) detectedBrand = 'Apple';
    else if (lower.includes('samsung') || lower.includes('galaxy')) detectedBrand = 'Samsung';
    else if (lower.includes('redmi') || lower.includes('xiaomi')) detectedBrand = 'Xiaomi';
    else if (lower.includes('vivo')) detectedBrand = 'Vivo';
    else if (lower.includes('oppo')) detectedBrand = 'Oppo';
    else if (lower.includes('oneplus')) detectedBrand = 'OnePlus';
    else if (lower.includes('realme')) detectedBrand = 'Realme';
    else if (lower.includes('infinix')) detectedBrand = 'Infinix';
    else if (lower.includes('tecno')) detectedBrand = 'Tecno';

    const newDevice = recordUsedIntake({
      deviceType,
      brand: detectedBrand,
      model: phoneName.trim(),
      storage,
      color: color.trim() || 'Standard',
      imei1: imei1.trim(),
      imei2: imei2.trim() || undefined,
      conditionGrade: deviceType === 'new' ? 'Brand New (Box Pack)' : conditionGrade,
      batteryHealth: deviceType === 'used' ? Number(batteryHealth) : undefined,
      screenCondition: deviceType === 'used' ? screenCondition : undefined,
      accessories: deviceType === 'new' ? ['Original Box', 'USB Cable'] : ['Original Box'],
      networkStatus,
      purchaseCost: cost,
      sellingPriceTarget: target,
      minPrice: cost > 0 ? Math.round(cost * 1.05) : target,
      purchaseDate: new Date().toISOString(),
      supplierOrSeller: {
        name: sellerName.trim() || (deviceType === 'new' ? 'Distributor / Supplier' : 'Walk-in Customer'),
        fatherName: sellerFatherName.trim() || undefined,
        phone: sellerPhone.trim(),
        cnicOrGovId: sellerCnic.trim() || undefined,
        address: sellerAddress.trim() || undefined,
        type: deviceType === 'new' ? 'Distributor' : 'Walk-in Customer',
      },
      policeProtection: deviceType === 'used' || sellerCnic.trim() ? {
        verificationStatus: policeRecordCheck ? 'verified' : 'pending',
        policeRecordCheck,
        idCardFrontUploaded: !!sellerCnic.trim(),
        idCardNumber: sellerCnic.trim() || undefined,
        sellerFatherName: sellerFatherName.trim() || undefined,
        sellerCityAddress: sellerAddress.trim() || undefined,
        policeStationJurisdiction: policeStation.trim() || 'Local Police Station',
        affidavitSigned,
        sellerThumbprintCaptured: true,
        verifiedByOfficerOrStaff: settings.ownerName || 'Store Manager',
        verificationDate: new Date().toISOString(),
        notes: `Recorded on intake by ${settings.shopName}. Stolen/lost status check: ${policeRecordCheck ? 'Passed' : 'Pending'}.`
      } : undefined,
      status: 'in_stock',
      notes: notes.trim() || undefined,
    });

    setRecentlyAddedDevice(newDevice);
    setSavedSuccess(true);
  };

  const handleResetForm = () => {
    setPhoneName('');
    setImei1('');
    setImei2('');
    setSellerName('');
    setSellerFatherName('');
    setSellerPhone('');
    setSellerCnic('');
    setSellerAddress('');
    setAgreedPurchasePrice('');
    setTargetSellingPrice('');
    setSavedSuccess(false);
    setRecentlyAddedDevice(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#161B2E] to-[#121520] text-white p-5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Quick Mobile Intake
            </span>
            <span className="text-xs text-indigo-300 font-mono">Fast Form</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Mobile Device Intake Station
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Quickly enter phone name, IMEI, condition, and purchaser/seller details
          </p>
        </div>
      </div>

      {savedSuccess && recentlyAddedDevice && (
        <div className="bg-[#12221A] border border-emerald-500/60 text-white p-4 rounded-2xl shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 rounded-xl text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">
                  {recentlyAddedDevice.brand} {recentlyAddedDevice.model} added to stock!
                </h3>
                <p className="text-xs text-slate-300">
                  IMEI: <span className="font-mono text-cyan-300 font-bold">{recentlyAddedDevice.imei1}</span> • Seller: {recentlyAddedDevice.supplierOrSeller?.name}
                  {recentlyAddedDevice.supplierOrSeller?.cnicOrGovId && ` (ID: ${recentlyAddedDevice.supplierOrSeller.cnicOrGovId})`}
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-900/60 text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/40">
              In Stock
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-800/40">
            {recentlyAddedDevice.policeProtection && (
              <button
                type="button"
                onClick={() => setSelectedPoliceCertDevice(recentlyAddedDevice)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Police Protection Certificate</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedDeviceForModal(recentlyAddedDevice)}
              className="px-3.5 py-2 bg-[#1A2234] hover:bg-[#222C44] text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>View Device Details</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer ml-auto"
            >
              Add Another Phone
            </button>
          </div>
        </div>
      )}

      {/* Main Streamlined Intake Form */}
      <form onSubmit={handleSubmit} className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4 text-xs text-slate-200">
        
        {/* 1. Used or New */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            1. Condition (Used or New)
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
        <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
              2. Phone Name / Model *
            </label>
            <span className="text-[10px] text-slate-400">Quick Brands:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {popularBrands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleBrandSelect(b)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                  brand === b
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : 'bg-[#10131B] text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="e.g. iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Vivo V30, Redmi 13..."
            value={phoneName}
            onChange={(e) => setPhoneName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#0F1118] border border-slate-700 rounded-lg text-sm font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            required
            autoFocus
          />
        </div>

        {/* 3. IMEI */}
        <div className="bg-[#10192A] p-4 rounded-xl border border-blue-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              3. IMEI Number (15 Digits) *
            </label>
            <button
              type="button"
              onClick={generateDemoImei}
              className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Demo IMEI
            </button>
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
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>
        </div>

        {/* 4. Purchaser / Seller Info & Pricing */}
        <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              4. {deviceType === 'new' ? 'Purchaser / Distributor Info & Cost' : 'Seller (Customer) Info & Police Record'}
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
                placeholder={deviceType === 'new' ? 'e.g. City Distributors' : 'e.g. Ali Khan'}
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+92 300 1234567"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* ID Card / CNIC & Father's Name */}
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
                    value={sellerCnic}
                    onChange={(e) => setSellerCnic(e.target.value)}
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
                  className="px-2.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
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
                value={sellerFatherName}
                onChange={(e) => setSellerFatherName(e.target.value)}
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
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
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
                  placeholder="e.g. 45000"
                  value={agreedPurchasePrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAgreedPurchasePrice(val);
                    if (val !== '' && !targetSellingPrice) {
                      setTargetSellingPrice(Math.round(Number(val) * 1.15));
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-emerald-700/60 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                Target Resale Price ({settings.currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-bold">{settings.currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 52000"
                  value={targetSellingPrice}
                  onChange={(e) => setTargetSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-[#08130F] border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Optional Extra Specs */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0A0C13]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>➕</span>
              <span>Optional Details (Storage, Color, Battery Health, Notes)</span>
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
                    placeholder="e.g. Space Gray, Silver"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Network Status</label>
                  <select
                    value={networkStatus}
                    onChange={(e) => setNetworkStatus(e.target.value as NetworkStatus)}
                    className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                  >
                    <option value="PTA Approved">PTA Approved</option>
                    <option value="Non-PTA">Non-PTA</option>
                    <option value="JV / Gevey Lock">JV / Gevey Lock</option>
                    <option value="Factory Unlocked">Factory Unlocked</option>
                  </select>
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
                      value={batteryHealth}
                      onChange={(e) => setBatteryHealth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Remarks / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased with original box..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#171B26] border border-slate-700 rounded-lg text-xs text-white outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Complete Intake & Add Phone to Stock</span>
          </button>
        </div>

      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={scannerTarget === 'imei' ? "Scan IMEI Barcode / QR Code" : "Scan ID Card Barcode / CNIC QR Code"}
        subtitle={
          scannerTarget === 'imei'
            ? "Point camera at retail box sticker, back cover barcode, or dial pad (*#06#) on the device."
            : "Point camera at the barcode or QR code on national identity card, driving license, or passport."
        }
        onScanSuccess={(scannedCode) => {
          if (scannerTarget === 'imei') {
            setImei1(scannedCode);
          } else {
            setSellerCnic(scannedCode);
          }
        }}
      />

    </div>
  );
};

