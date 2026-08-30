import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { MobileItem, DeviceType, DeviceStatus, ConditionGrade } from '../types/mobile';
import { 
  Smartphone, 
  Search, 
  Filter, 
  PlusCircle, 
  Battery, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Receipt, 
  Eye, 
  ShoppingBag, 
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Tag,
  Camera,
  Barcode,
  FileSpreadsheet,
  Download,
  Printer
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const InventoryView: React.FC = () => {
  const { 
    inventory, 
    formatCurrency, 
    setSelectedDeviceForModal, 
    setSelectedPoliceCertDevice,
    setIsAddModalOpen, 
    setIsPosModalOpen,
    setSelectedDeviceForSale,
    updateMobileStatus,
    exportInventoryToSheets,
    setIsBackupModalOpen
  } = useShop();

  // Filters & State
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<'all' | 'new' | 'used'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'sold' | 'under_repair'>('in_stock');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchField, setSearchField] = useState<'all' | 'imei' | 'customer' | 'model'>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'price_desc' | 'price_asc' | 'brand_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Stats calculation
  const stats = useMemo(() => {
    const inStock = inventory.filter((d) => d.status === 'in_stock');
    const newItems = inStock.filter((d) => d.deviceType === 'new');
    const usedItems = inStock.filter((d) => d.deviceType === 'used');
    const soldItems = inventory.filter((d) => d.status === 'sold');

    const totalCost = inStock.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);
    const totalExpectedRevenue = inStock.reduce((acc, curr) => acc + (curr.sellingPriceTarget || 0), 0);
    const totalRealizedProfit = soldItems.reduce((acc, curr) => acc + (curr.saleRecord?.profit || 0), 0);

    return {
      inStockCount: inStock.length,
      newCount: newItems.length,
      usedCount: usedItems.length,
      soldCount: soldItems.length,
      totalCost,
      totalExpectedRevenue,
      expectedMargin: totalExpectedRevenue - totalCost,
      totalRealizedProfit,
    };
  }, [inventory]);

  // Unique brands & storages for filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set(inventory.map((d) => d.brand));
    return Array.from(brands).sort();
  }, [inventory]);

  const uniqueStorages = useMemo(() => {
    const storages = new Set(inventory.map((d) => d.storage));
    return Array.from(storages).sort();
  }, [inventory]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      // Device Type
      if (deviceTypeFilter !== 'all' && item.deviceType !== deviceTypeFilter) return false;
      
      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      
      // Brand
      if (brandFilter !== 'all' && item.brand !== brandFilter) return false;

      // Storage
      if (storageFilter !== 'all' && item.storage !== storageFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();

        if (searchField === 'imei') {
          const matchImei1 = item.imei1?.toLowerCase().includes(q);
          const matchImei2 = item.imei2?.toLowerCase().includes(q);
          const matchSerial = item.serialNumber?.toLowerCase().includes(q);
          return matchImei1 || matchImei2 || matchSerial;
        }

        if (searchField === 'customer') {
          const matchCustomer = item.saleRecord?.customer?.name?.toLowerCase().includes(q);
          const matchCustomerPhone = item.saleRecord?.customer?.phone?.toLowerCase().includes(q);
          const matchSupplier = item.supplierOrSeller?.name?.toLowerCase().includes(q);
          const matchSupplierPhone = item.supplierOrSeller?.phone?.toLowerCase().includes(q);
          const matchCnic = item.supplierOrSeller?.cnicOrGovId?.toLowerCase().includes(q) || item.saleRecord?.customer?.cnicOrGovId?.toLowerCase().includes(q);
          return matchCustomer || matchCustomerPhone || matchSupplier || matchSupplierPhone || matchCnic;
        }

        if (searchField === 'model') {
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchModel = item.model.toLowerCase().includes(q);
          const matchColor = item.color?.toLowerCase().includes(q);
          return matchBrand || matchModel || matchColor;
        }

        // 'all' search
        const matchesBrand = item.brand.toLowerCase().includes(q);
        const matchesModel = item.model.toLowerCase().includes(q);
        const matchesImei1 = item.imei1?.toLowerCase().includes(q);
        const matchesImei2 = item.imei2?.toLowerCase().includes(q);
        const matchesSerial = item.serialNumber?.toLowerCase().includes(q);
        const matchesColor = item.color?.toLowerCase().includes(q);
        const matchesSupplier = item.supplierOrSeller?.name?.toLowerCase().includes(q);
        const matchesCustomer = item.saleRecord?.customer?.name?.toLowerCase().includes(q);
        if (!matchesBrand && !matchesModel && !matchesImei1 && !matchesImei2 && !matchesSerial && !matchesColor && !matchesSupplier && !matchesCustomer) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price_desc') {
        return b.sellingPriceTarget - a.sellingPriceTarget;
      }
      if (sortBy === 'price_asc') {
        return a.sellingPriceTarget - b.sellingPriceTarget;
      }
      if (sortBy === 'brand_asc') {
        return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
      }
      return 0;
    });
  }, [inventory, deviceTypeFilter, statusFilter, brandFilter, storageFilter, searchQuery, searchField, sortBy]);

  const handleSellDirect = (device: MobileItem) => {
    setSelectedDeviceForSale(device);
    setIsPosModalOpen(true);
  };

  const getBatteryBadgeColor = (health?: number) => {
    if (!health) return 'text-slate-400 bg-slate-800/80 border-slate-700/60';
    if (health >= 85) return 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30';
    if (health >= 80) return 'text-amber-300 bg-amber-950/60 border-amber-500/30';
    return 'text-rose-300 bg-rose-950/60 border-rose-500/30';
  };

  return (
    <div className="space-y-5">
      
      {/* Top Metric Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total In Stock */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">In-Stock Phones</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{stats.inStockCount}</span>
              <span className="text-xs text-slate-400 font-medium">units</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-400">
              <span className="text-emerald-400 font-bold">{stats.newCount} New</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400 font-bold">{stats.usedCount} Used</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* Stock Valuation Cost */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Total Stock Cost</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{formatCurrency(stats.totalCost)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Capital tied in physical inventory
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Expected Selling Value */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Target Retail Value</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{formatCurrency(stats.totalExpectedRevenue)}</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 font-medium block mt-1">
              +{formatCurrency(stats.expectedMargin)} potential profit
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Total Realized Profit */}
        <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block">Realized Net Profit</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-400">+{formatCurrency(stats.totalRealizedProfit)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              From {stats.soldCount} completed sales
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter & Search Control Panel */}
      <div className="bg-[#12151E] p-4 rounded-xl border border-slate-800/90 shadow-sm space-y-3">
        
        {/* Top Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input with Mode Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
            <div className="sm:w-44 shrink-0">
              <select
                id="select-inventory-search-field"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="w-full bg-[#171B26] border border-slate-700/70 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="all">🔍 All Fields</option>
                <option value="imei">📱 Search by IMEI</option>
                <option value="customer">👤 Customer / Seller</option>
                <option value="model">🏷️ Brand / Model</option>
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  searchField === 'imei'
                    ? 'Search by 15-digit IMEI or Serial number...'
                    : searchField === 'customer'
                    ? 'Search by Customer or Seller Name/Phone/CNIC...'
                    : searchField === 'model'
                    ? 'Search by Brand, Model, or Color...'
                    : 'Search by Model, Brand, IMEI, Serial, Customer...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-medium text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-[#1C2130] outline-none transition-all"
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

          {/* Quick Segmented Tabs: All / Brand New / Used */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="bg-[#171B26] p-1 rounded-lg flex items-center text-xs font-medium border border-slate-700/60">
              <button
                id="filter-type-all"
                onClick={() => setDeviceTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  deviceTypeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Devices ({inventory.length})
              </button>
              <button
                id="filter-type-new"
                onClick={() => setDeviceTypeFilter('new')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  deviceTypeFilter === 'new'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Brand New</span>
              </button>
              <button
                id="filter-type-used"
                onClick={() => setDeviceTypeFilter('used')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  deviceTypeFilter === 'used'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Used / Pre-Owned</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-[#171B26] p-1 rounded-lg flex items-center border border-slate-700/60">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-[#222736] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Cards Grid View"
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-[#222736] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Dropdown Filters Sub-row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#171B26] border border-slate-700/70 rounded-md px-2.5 py-1 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="sold">Sold History</option>
              <option value="under_repair">In Repair</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Brand:</span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-[#171B26] border border-slate-700/70 rounded-md px-2.5 py-1 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Brands ({uniqueBrands.length})</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Storage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Storage:</span>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="bg-[#171B26] border border-slate-700/70 rounded-md px-2.5 py-1 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Storages</option>
              {uniqueStorages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sort By & Export */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => exportInventoryToSheets('xlsx')}
              className="px-2.5 py-1 bg-[#1A1F2C] hover:bg-[#23293B] text-emerald-400 hover:text-emerald-300 rounded-md border border-emerald-800/40 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export filtered inventory to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Stock Sheet</span>
            </button>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#171B26] border border-slate-700/70 rounded-md px-2.5 py-1 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="date_desc">Latest Added</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="brand_asc">Brand (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Main Results View */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#12151E] p-12 text-center rounded-xl border border-slate-800/90 shadow-sm space-y-3">
          <Smartphone className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-bold text-base text-white">No mobile phones match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your search query or filters, or add a new mobile phone into inventory.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-md shadow-blue-900/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Mobile Phone</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ======================== TABULAR VIEW ======================== */
        <div className="bg-[#12151E] rounded-xl border border-slate-800/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B0D14] text-slate-300 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <th className="py-3 px-3.5">Device Specs</th>
                  <th className="py-3 px-3">Condition & Battery</th>
                  <th className="py-3 px-3">Primary IMEI 1</th>
                  <th className="py-3 px-3">Network / PTA</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Target Price</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => {
                  const isSold = item.status === 'sold';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#171B26]/80 transition-colors ${
                        isSold ? 'bg-[#0E1017]/60 opacity-70' : 'bg-[#12151E]'
                      }`}
                    >
                      {/* Device Title & Brand */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            item.deviceType === 'new'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                          }`}>
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white hover:text-blue-400 cursor-pointer" onClick={() => setSelectedDeviceForModal(item)}>
                                {item.brand} {item.model}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                item.deviceType === 'new' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                              }`}>
                                {item.deviceType === 'new' ? 'NEW' : 'USED'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              <span>{item.storage} {item.ram ? `• ${item.ram}` : ''}</span>
                              <span className="mx-1 text-slate-600">•</span>
                              <span className="text-slate-300">{item.color}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Condition & Battery Health */}
                      <td className="py-3 px-3">
                        {item.deviceType === 'new' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sealed Box
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-300 block truncate max-w-[130px]">
                              {item.conditionGrade || 'Standard Grade'}
                            </span>
                            {item.batteryHealth ? (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${getBatteryBadgeColor(item.batteryHealth)}`}>
                                <Battery className="w-2.5 h-2.5" />
                                {item.batteryHealth}% Battery
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Primary IMEI */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-200 tracking-wider">
                        <span className="bg-[#171B26] px-2 py-1 rounded border border-slate-700/60 select-all block max-w-[150px] truncate text-cyan-300">
                          {item.imei1}
                        </span>
                      </td>

                      {/* Network / PTA */}
                      <td className="py-3 px-3 text-[11px]">
                        <span className="font-medium text-slate-300 truncate max-w-[130px] block" title={item.networkStatus}>
                          {item.networkStatus}
                        </span>
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3 px-3 text-right font-medium text-slate-400">
                        {formatCurrency(item.purchaseCost)}
                      </td>

                      {/* Target Selling Price */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-emerald-400 text-sm block">
                          {formatCurrency(item.sellingPriceTarget)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Margin: +{formatCurrency(item.sellingPriceTarget - item.purchaseCost)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'in_stock' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' :
                          item.status === 'sold' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                          'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                        }`}>
                          {item.status === 'in_stock' ? 'In Stock' : item.status === 'sold' ? 'Sold' : item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.policeProtection && (
                            <button
                              type="button"
                              onClick={() => setSelectedPoliceCertDevice(item)}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-md transition-colors cursor-pointer"
                              title="Print Police Protection Certificate"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDeviceForModal(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-[#1B202E] rounded-md transition-colors cursor-pointer"
                            title="View Specifications & Diagnostic Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === 'in_stock' && (
                            <button
                              onClick={() => handleSellDirect(item)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Sell</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================== GRID CARDS VIEW ======================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isSold = item.status === 'sold';
            return (
              <div
                key={item.id}
                className={`bg-[#12151E] rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 ${
                  isSold ? 'border-slate-800/80 opacity-70' : 'border-slate-800/90 hover:border-blue-500/40 hover:bg-[#141824]'
                }`}
              >
                <div>
                  {/* Card Header: Type Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.deviceType === 'new' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                    }`}>
                      {item.deviceType === 'new' ? 'Brand New' : 'Used Phone'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'in_stock' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/40' :
                      item.status === 'sold' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-amber-950/80 text-amber-300 border border-amber-700/40'
                    }`}>
                      {item.status === 'in_stock' ? '● In Stock' : item.status === 'sold' ? '✓ Sold' : item.status}
                    </span>
                  </div>

                  {/* Device Title */}
                  <h4 
                    onClick={() => setSelectedDeviceForModal(item)}
                    className="font-bold text-sm text-white hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {item.brand} {item.model}
                  </h4>
                  
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    {item.storage} {item.ram ? `/ ${item.ram}` : ''} • {item.color}
                  </div>

                  {/* IMEI pill */}
                  <div className="mt-2.5 bg-[#171B26] p-2 rounded-lg border border-slate-700/60 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-sans">IMEI 1:</span>
                    <span className="font-bold select-all tracking-wider text-cyan-300">{item.imei1}</span>
                  </div>

                  {/* Used device specifics: Battery, Grade */}
                  {item.deviceType === 'used' && (
                    <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 font-medium text-[11px] truncate">{item.conditionGrade}</span>
                      {item.batteryHealth && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getBatteryBadgeColor(item.batteryHealth)}`}>
                          {item.batteryHealth}% Battery
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price & Action Row */}
                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Selling Target</span>
                    <span className="font-bold text-emerald-400 text-base">
                      {formatCurrency(item.sellingPriceTarget)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.policeProtection && (
                      <button
                        type="button"
                        onClick={() => setSelectedPoliceCertDevice(item)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 transition-colors cursor-pointer"
                        title="Print Police Protection Certificate"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedDeviceForModal(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-[#171B26] hover:bg-[#1E2333] border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    {item.status === 'in_stock' && (
                      <button
                        onClick={() => handleSellDirect(item)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Sell</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan IMEI Barcode to Filter Inventory"
        subtitle="Point camera at phone box or device screen (*#06#) to find matching stock immediately."
        onScanSuccess={(scannedCode) => {
          setSearchField('imei');
          setSearchQuery(scannedCode);
        }}
      />

    </div>
  );
};
