import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Boxes, 
  ReceiptText, 
  Smartphone, 
  Users, 
  TrendingUp, 
  SlidersHorizontal, 
  Barcode, 
  Store,
  FileSpreadsheet,
  PlusCircle,
  Zap,
  Package,
  Activity,
  ShieldCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    settings, 
    activeTab, 
    setActiveTab, 
    setIsAddModalOpen, 
    setIsImeiSearchOpen, 
    setIsPosModalOpen,
    setIsBackupModalOpen,
    setIsInstallModalOpen,
    inventory,
    sales,
    customers
  } = useShop();

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const newStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'new').length;
  const usedStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'used').length;

  // Logical retail menu order with distinctive icons, sublabels, and color accents
  const navItems = [
    { 
      id: 'inventory', 
      label: 'Inventory Hub', 
      sublabel: 'Stock & IMEIs',
      icon: Boxes, 
      badge: inStockCount,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      activeColor: 'from-sky-600 to-blue-600 text-white shadow-sky-500/20'
    },
    { 
      id: 'invoices', 
      label: 'POS & Invoices', 
      sublabel: 'Sales & Billing',
      icon: ReceiptText, 
      badge: sales.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      activeColor: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
    },
    { 
      id: 'intake', 
      label: 'Buy Used Intake', 
      sublabel: 'Testing & Police Cert',
      icon: Smartphone, 
      badge: usedStockCount > 0 ? `${usedStockCount} used` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activeColor: 'from-amber-600 to-orange-600 text-white shadow-amber-500/20'
    },
    { 
      id: 'customers', 
      label: 'Customers & Khata', 
      sublabel: 'Ledger & Accounts',
      icon: Users, 
      badge: customers.length,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      activeColor: 'from-purple-600 to-indigo-600 text-white shadow-purple-500/20'
    },
    { 
      id: 'analytics', 
      label: 'Profit & Reports', 
      sublabel: 'Margins & Analytics',
      icon: TrendingUp, 
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      activeColor: 'from-rose-600 to-pink-600 text-white shadow-rose-500/20'
    },
    { 
      id: 'settings', 
      label: 'Shop Settings', 
      sublabel: 'Config & Backup',
      icon: SlidersHorizontal, 
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      activeColor: 'from-slate-700 to-slate-800 text-white shadow-slate-700/20'
    },
  ];

  return (
    <header className="bg-[#0e1017] text-white border-b border-slate-800/90 sticky top-0 z-30 shadow-xl shadow-black/40 backdrop-blur-xl">
      {/* Top Banner with Shop branding and quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 duration-200">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0e1017] rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                <span>{settings.shopName || 'ZAFAR MOBILE STORE'}</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>POS Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal truncate max-w-xs sm:max-w-md">
              {settings.tagline || 'Mobile Inventory, IMEI Diagnostics & Khata Ledger'}
            </p>
          </div>
        </div>

        {/* Quick Search & Primary POS Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick IMEI / Customer Search Button */}
          <button
            id="btn-quick-imei-search"
            onClick={() => setIsImeiSearchOpen(true)}
            className="flex items-center gap-2 bg-[#151824] hover:bg-[#1c2130] text-slate-200 hover:text-white px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-medium transition-all shadow-xs cursor-pointer group"
          >
            <Barcode className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xs:inline">Search IMEI / Customer</span>
            <span className="xs:hidden">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#0b0d13] text-slate-400 rounded-md border border-slate-700 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Install Mobile App / APK Button */}
          <button
            id="btn-install-mobile-app"
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#151824] hover:bg-[#1e2333] text-sky-400 hover:text-sky-300 px-3 py-2 rounded-xl border border-sky-800/40 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Install Mobile Store app or APK on Mobile"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden lg:inline">Install APK</span>
          </button>

          {/* Backup & Spreadsheet Export Button */}
          <button
            id="btn-backup-sheets-export"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#151824] hover:bg-[#1e2333] text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-xl border border-emerald-800/40 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Export Excel/Google Sheets & Backup Data to Gmail"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden lg:inline">Sheets Backup</span>
          </button>

          {/* Record Sale / POS Button */}
          <button
            id="btn-quick-pos-sale"
            onClick={() => setIsPosModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Quick POS Sale</span>
          </button>

          {/* Add Mobile Button */}
          <button
            id="btn-add-mobile"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-950/50 hover:shadow-blue-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Mobile</span>
          </button>
        </div>
      </div>

      {/* Navigation Menu Bar with Logical Order & Rich Icons */}
      <div className="bg-[#090a0f] border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-1.5 gap-2">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center gap-2.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeColor} shadow-md ring-1 ring-white/20 font-bold`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141722]/80'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/15 text-white' 
                      : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex flex-col items-start leading-tight">
                    <span className="tracking-tight">{item.label}</span>
                    <span className={`text-[10px] hidden xl:inline font-normal ${
                      isActive ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-400'
                    }`}>
                      {item.sublabel}
                    </span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        isActive 
                          ? 'bg-white/20 text-white border-white/30' 
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active bottom glow accent indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/60 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mini Live Stock Stats & Info */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 border-l border-slate-800/90 pl-4 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141722] border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px]">New:</span>
              <strong className="text-slate-200 text-xs">{newStockCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141722] border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span className="text-[11px]">Used:</span>
              <strong className="text-slate-200 text-xs">{usedStockCount}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141722] border border-slate-800">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Total:</span>
              <strong className="text-white text-xs">{inStockCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
