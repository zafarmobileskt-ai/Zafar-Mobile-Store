import React, { useState, useMemo } from 'react';
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
  FileText,
  Calendar,
  RotateCcw,
  History,
  Search,
  ReceiptText,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  PlusCircle,
  Layers,
  ArrowUpRight,
  ShoppingCart
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const BuyUsedMobileView: React.FC = () => {
  const { 
    inventory,
    sales,
    formatCurrency,
    recordUsedIntake, 
    settings, 
    setActiveTab, 
    setSelectedDeviceForModal,
    setSelectedPoliceCertDevice,
    setIsPosModalOpen,
    setSelectedDeviceForSale,
    setSelectedInvoiceForModal,
    customers,
    setSelectedCustomerForModal
  } = useShop();

  // Tab state: Intake Form vs Purchase History
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'history'>('form');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'sold' | 'in_stock'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

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

  // Date of Data / Intake Date
  const [intakeDate, setIntakeDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

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

  const handleCopyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    setCopiedImei(imei);
    setTimeout(() => setCopiedImei(null), 2000);
  };

  // Helper to reliably find the matching SaleRecord for any item
  const getSaleForItem = useCallback((item: MobileItem): SaleRecord | undefined => {
    if (item.saleRecord) return item.saleRecord;
    return sales.find((s) => (s.deviceId && s.deviceId === item.id) || (s.imei1 && item.imei1 && s.imei1 === item.imei1));
  }, [sales]);

  // Helper to determine if an item is sold
  const isItemSold = useCallback((item: MobileItem): boolean => {
    if (item.status === 'sold') return true;
    if (item.saleRecord) return true;
    return sales.some((s) => (s.deviceId && s.deviceId === item.id) || (s.imei1 && item.imei1 && s.imei1 === item.imei1));
  }, [sales]);

  // Comprehensive purchase and intake history containing all stock & sold devices
  const purchasedHistory = useMemo(() => {
    const list: MobileItem[] = [...inventory];
    const inventoryImeis = new Set(inventory.map((i) => i.imei1));
    const inventoryIds = new Set(inventory.map((i) => i.id));

    // Also include any sales records from store history that don't match an active inventory device
    sales.forEach((sale) => {
      const hasItem = (sale.deviceId && inventoryIds.has(sale.deviceId)) || (sale.imei1 && inventoryImeis.has(sale.imei1));
      if (!hasItem) {
        list.push({
          id: sale.deviceId || `MOB-${sale.saleId}`,
          deviceType: sale.deviceType || 'used',
          brand: sale.deviceTitle.split(' ')[0] || 'Mobile',
          model: sale.deviceTitle,
          color: 'Standard',
          storage: 'N/A',
          imei1: sale.imei1,
          imei2: sale.imei2,
          accessories: ['Device'],
          networkStatus: 'PTA Approved',
          purchaseCost: sale.purchaseCost || 0,
          sellingPriceTarget: sale.soldPrice || 0,
          minPrice: sale.soldPrice || 0,
          purchaseDate: sale.saleDate,
          supplierOrSeller: {
            name: 'Original Intake / Trade-in',
            phone: '',
            type: 'Trade-in Exchange'
          },
          status: 'sold',
          saleRecord: sale,
          createdAt: sale.saleDate,
          updatedAt: sale.saleDate,
        });
      }
    });

    return list.sort((a, b) => new Date(b.purchaseDate || b.createdAt).getTime() - new Date(a.purchaseDate || a.createdAt).getTime());
  }, [inventory, sales]);

  const soldCount = useMemo(() => purchasedHistory.filter((item) => isItemSold(item)).length, [purchasedHistory, isItemSold]);
  const inStockCount = useMemo(() => purchasedHistory.filter((item) => !isItemSold(item)).length, [purchasedHistory, isItemSold]);
  const totalPurchaseCost = useMemo(() => purchasedHistory.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0), [purchasedHistory]);
  const totalRealizedProfit = useMemo(() => purchasedHistory.reduce((acc, curr) => {
    const sale = getSaleForItem(curr);
    return acc + (sale?.profit || 0);
  }, 0), [purchasedHistory, getSaleForItem]);

  const filteredHistory = useMemo(() => {
    return purchasedHistory.filter((item) => {
      const sold = isItemSold(item);
      const sale = getSaleForItem(item);

      if (historyStatusFilter === 'sold' && !sold) return false;
      if (historyStatusFilter === 'in_stock' && sold) return false;

      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchesModel = `${item.brand} ${item.model}`.toLowerCase().includes(q);
        const matchesImei = (item.imei1 || '').toLowerCase().includes(q) || (item.imei2?.toLowerCase().includes(q) ?? false);
        const matchesSeller = (item.supplierOrSeller?.name || '').toLowerCase().includes(q) || 
          (item.supplierOrSeller?.phone?.toLowerCase().includes(q) ?? false) || 
          (item.supplierOrSeller?.cnicOrGovId?.toLowerCase().includes(q) ?? false);
        const matchesBuyer = (sale?.customer?.name || '').toLowerCase().includes(q) || 
          (sale?.customer?.phone?.toLowerCase().includes(q) ?? false) || 
          (sale?.customer?.cnicOrGovId?.toLowerCase().includes(q) ?? false) || 
          (sale?.customer?.fatherName?.toLowerCase().includes(q) ?? false) ||
          (sale?.invoiceNumber?.toLowerCase().includes(q) ?? false);
        return matchesModel || matchesImei || matchesSeller || matchesBuyer;
      }
      return true;
    });
  }, [purchasedHistory, historyStatusFilter, historySearchQuery, isItemSold, getSaleForItem]);

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
      purchaseDate: intakeDate ? new Date(intakeDate).toISOString() : new Date().toISOString(),
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
        verificationDate: intakeDate ? new Date(intakeDate).toISOString() : new Date().toISOString(),
        notes: `Recorded on intake by ${settings.shopName}. Stolen/lost status check: ${policeRecordCheck ? 'Passed' : 'Pending'}.`
      } : undefined,
      status: 'in_stock',
      notes: notes.trim() || undefined,
    });

    setRecentlyAddedDevice(newDevice);
    setSavedSuccess(true);

    // Clear all fields immediately to avoid accidental re-submission of old data
    setPhoneName('');
    setImei1('');
    setImei2('');
    setSellerName('');
    setSellerFatherName('');
    setSellerPhone('');
    setSellerCnic('');
    setSellerAddress('');
    setPoliceStation('');
    setAgreedPurchasePrice('');
    setTargetSellingPrice('');
    setColor('');
    setNotes('');
    setIntakeDate(new Date().toISOString().split('T')[0]);
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
    setPoliceStation('');
    setAgreedPurchasePrice('');
    setTargetSellingPrice('');
    setColor('');
    setNotes('');
    setStorage('128GB');
    setConditionGrade('Grade A (Minor Wear)');
    setBatteryHealth(88);
    setScreenCondition('Original Pristine');
    setNetworkStatus('PTA Approved');
    setIntakeDate(new Date().toISOString().split('T')[0]);
    setSavedSuccess(false);
    setRecentlyAddedDevice(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#161B2E] to-[#121520] text-white p-5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-950/50">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white uppercase tracking-wider">
                Device Purchases & Intake
              </span>
              <span className="text-xs text-indigo-300 font-mono">Stock Intake, Seller Records & History</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Mobile Intake & Purchase History
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Record new phone purchases from walk-in sellers or view full purchase history with sold items & customer data
            </p>
          </div>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'form'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
              : 'bg-[#12151E] text-slate-400 hover:text-slate-200 hover:bg-[#1A1F2C] border border-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Mobile Intake Form</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
              : 'bg-[#12151E] text-slate-400 hover:text-slate-200 hover:bg-[#1A1F2C] border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Purchase & Intake History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono">
            {purchasedHistory.length}
          </span>
          {soldCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
              {soldCount} Sold
            </span>
          )}
        </button>
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
              onClick={() => setActiveSubTab('history')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>View in Purchase History →</span>
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
      {activeSubTab === 'form' && (
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-blue-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>Date of Intake / Purchase *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIntakeDate(new Date().toISOString().split('T')[0])}
                  className="text-[9px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Today
                </button>
              </div>
              <input
                type="date"
                required
                value={intakeDate}
                onChange={(e) => setIntakeDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#0F1118] border border-blue-700/60 rounded-lg text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-emerald-300 mb-1">
                Purchase Cost ({settings.currencySymbol}) *
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

        {/* Submit & Form Reset */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Clear all fields to start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Form</span>
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Complete Intake & Add Phone to Stock</span>
          </button>
        </div>

      </form>
      )}

      {/* ==================== TAB 2: PURCHASE & INTAKE HISTORY ==================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchased Devices</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-white">{purchasedHistory.length} Units</span>
                <span className="text-xs text-slate-400 font-medium">Cost: {formatCurrency(totalPurchaseCost)}</span>
              </div>
            </div>

            <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Sold Intake Items</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold">
                  With Full Sales Data
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-indigo-400">{soldCount} Sold</span>
                <span className="text-xs font-bold text-emerald-400">Profit: +{formatCurrency(totalRealizedProfit)}</span>
              </div>
            </div>

            <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Active In-Stock Stock</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-emerald-400">{inStockCount} In Stock</span>
                <span className="text-xs text-slate-400 font-medium">Available to Sell</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-[#12151E] p-3.5 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  historyStatusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#171B26] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Purchases ({purchasedHistory.length})
              </button>

              <button
                type="button"
                onClick={() => setHistoryStatusFilter('sold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  historyStatusFilter === 'sold'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-[#171B26] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5 text-indigo-300" />
                <span>Sold Items ({soldCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setHistoryStatusFilter('in_stock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  historyStatusFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#171B26] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>In Stock ({inStockCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search IMEI, model, seller or buyer..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0D1017] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* History Records Table / Cards */}
          {filteredHistory.length === 0 ? (
            <div className="bg-[#12151E] p-10 rounded-2xl border border-slate-800 text-center space-y-2">
              <History className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="font-bold text-sm text-white">No purchase records found</h3>
              <p className="text-xs text-slate-400">
                {historySearchQuery ? 'Try adjusting your search query.' : 'No devices match the selected status filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isSold = isItemSold(item);
                const sale = getSaleForItem(item);

                const linkedBuyer = sale?.customer
                  ? customers.find((c) => 
                      (c.id && sale.customer.id && c.id === sale.customer.id) ||
                      (c.phone && sale.customer.phone && c.phone.replace(/\D/g, '') === sale.customer.phone.replace(/\D/g, '')) ||
                      (c.name && sale.customer.name && c.name.toLowerCase() === sale.customer.name.toLowerCase())
                    )
                  : undefined;

                const buyerName = sale?.customer?.name?.trim() || linkedBuyer?.name || (isSold ? 'Walk-in Customer' : '');
                const buyerFatherName = sale?.customer?.fatherName || linkedBuyer?.fatherName;
                const buyerPhone = sale?.customer?.phone || linkedBuyer?.phone;
                const buyerCnic = sale?.customer?.cnicOrGovId || linkedBuyer?.cnicOrGovId;
                const buyerAddress = sale?.customer?.address || linkedBuyer?.address;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSold 
                        ? 'bg-[#12151F] border-indigo-900/50 hover:border-indigo-700/70 shadow-xs' 
                        : 'bg-[#12151E] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Device Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          item.deviceType === 'new'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                        }`}>
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => setSelectedDeviceForModal(item)}
                              className="font-bold text-sm text-white hover:text-blue-400 cursor-pointer"
                            >
                              {item.brand} {item.model}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              item.deviceType === 'new' 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' 
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                            }`}>
                              {item.deviceType === 'new' ? 'BRAND NEW' : 'USED / INTAKE'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSold 
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60' 
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            }`}>
                              {isSold ? 'SOLD OUT' : 'IN STOCK'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.storage && <span>{item.storage} • </span>}
                            {item.color && <span>{item.color}</span>}
                            {item.conditionGrade && <span> • {item.conditionGrade}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Primary Price Metric */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Purchase Cost</span>
                          <span className="font-extrabold text-sm text-white font-mono">{formatCurrency(item.purchaseCost)}</span>
                        </div>
                        {isSold && sale && (
                          <div className="text-right sm:mt-0.5">
                            <span className="text-[10px] text-emerald-400 font-bold block">
                              Sold For: {formatCurrency(sale.finalAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs">
                      
                      {/* IMEI & Identification */}
                      <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Device IMEI</span>
                        <div className="flex items-center justify-between font-mono font-bold text-cyan-300">
                          <span>{item.imei1}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyImei(item.imei1)}
                            className="p-1 text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Copy Primary IMEI"
                          >
                            {copiedImei === item.imei1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {item.imei2 && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            SIM 2: {item.imei2}
                          </div>
                        )}
                      </div>

                      {/* Purchase Intake Data (Seller / Supplier) */}
                      <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Purchased From (Intake)</span>
                        <div className="font-semibold text-slate-200 truncate">
                          {item.supplierOrSeller?.name || 'Walk-in Seller'}
                          {item.supplierOrSeller?.fatherName && (
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              (S/O {item.supplierOrSeller.fatherName})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>{item.supplierOrSeller?.phone || 'No phone'}</span>
                          <span>{new Date(item.purchaseDate || item.createdAt).toLocaleDateString()}</span>
                        </div>
                        {item.supplierOrSeller?.cnicOrGovId && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            CNIC: {item.supplierOrSeller.cnicOrGovId}
                          </div>
                        )}
                        {item.supplierOrSeller?.address && (
                          <div className="text-[9px] text-slate-500 truncate" title={item.supplierOrSeller.address}>
                            {item.supplierOrSeller.address}
                          </div>
                        )}
                      </div>

                      {/* Current Sold Data OR In Stock Status */}
                      {isSold ? (
                        <div className="bg-[#101424] p-2.5 rounded-lg border border-indigo-800/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                              <ReceiptText className="w-3 h-3 text-indigo-400" />
                              <span>Sold Item & Buyer Data</span>
                            </span>
                            {sale?.profit !== undefined && (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                                Profit: +{formatCurrency(sale.profit)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (linkedBuyer) {
                                  setSelectedCustomerForModal(linkedBuyer);
                                } else if (sale) {
                                  setSelectedInvoiceForModal(sale);
                                }
                              }}
                              className="font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer text-left truncate max-w-[180px]"
                              title="View Customer CRM Profile"
                            >
                              Buyer: {buyerName}
                            </button>
                            {buyerFatherName && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                (S/O {buyerFatherName})
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-300 space-y-0.5">
                            {buyerPhone && (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-slate-400">{buyerPhone}</span>
                                {sale?.saleDate && (
                                  <span className="text-slate-400">Sold: {new Date(sale.saleDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            )}

                            {buyerCnic && (
                              <div className="text-[9px] font-mono text-cyan-300">
                                Buyer CNIC: {buyerCnic}
                              </div>
                            )}

                            {buyerAddress && (
                              <div className="text-[9px] text-slate-400 truncate" title={buyerAddress}>
                                City/Addr: {buyerAddress}
                              </div>
                            )}
                          </div>

                          {sale && (
                            <div className="text-[10px] font-mono text-indigo-300 flex items-center justify-between pt-1 border-t border-indigo-900/50">
                              <span 
                                onClick={() => setSelectedInvoiceForModal(sale)}
                                className="hover:underline cursor-pointer font-bold text-indigo-400"
                                title="Click to view full invoice"
                              >
                                {sale.invoiceNumber}
                              </span>
                              <span className="text-slate-400">{sale.paymentMethod}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#0A1610] p-2.5 rounded-lg border border-emerald-900/50 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stock Status</span>
                          <div className="font-bold text-emerald-300 text-xs">
                            Target Resale: {formatCurrency(item.sellingPriceTarget)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Expected Margin: +{formatCurrency(item.sellingPriceTarget - item.purchaseCost)}
                          </div>
                          <div className="text-[10px] text-emerald-500 font-medium">
                            Ready for POS checkout
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 italic truncate max-w-[200px] sm:max-w-md">
                        {item.notes || (isSold ? `Sold via ${sale?.invoiceNumber || 'POS Checkout'}` : 'In active store inventory')}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSold && sale ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForModal(sale)}
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-indigo-500/40 transition-colors cursor-pointer shadow-xs"
                            title="View official sale invoice bill with purchaser data"
                          >
                            <ReceiptText className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        ) : !isSold ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeviceForSale(item);
                              setIsPosModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Sell this device in POS"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Sell Device</span>
                          </button>
                        ) : null}

                        {item.policeProtection && (
                          <button
                            type="button"
                            onClick={() => setSelectedPoliceCertDevice(item)}
                            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-700/50 transition-colors cursor-pointer"
                            title="Print Police Protection Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDeviceForModal(item)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          Specs
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

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

