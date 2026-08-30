import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Smartphone, 
  Search, 
  PlusCircle, 
  ReceiptText, 
  ArrowLeftRight, 
  Layers, 
  TrendingUp, 
  Settings, 
  Barcode, 
  Store,
  FileSpreadsheet,
  Download,
  Users
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
    customers
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const newStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'new').length;
  const usedStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'used').length;

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsImeiSearchOpen(true);
    }
  };

  const navItems = [
    { id: 'inventory', label: 'Inventory Hub', icon: Layers, badge: inStockCount },
    { id: 'intake', label: 'Buy Used / Diagnostics', icon: Smartphone },
    { id: 'invoices', label: 'Invoices & Sales', icon: ReceiptText },
    { id: 'customers', label: 'Customers & CRM', icon: Users, badge: customers.length },
    { id: 'analytics', label: 'Profit & Reports', icon: TrendingUp },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
  ];

  return (
    <header className="bg-[#10121A] text-white border-b border-slate-800 sticky top-0 z-30 shadow-lg shadow-black/30">
      {/* Top Banner with Shop branding and quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">{settings.shopName}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/90 text-blue-300 border border-blue-800/50">
                POS & Inventory
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal truncate max-w-sm sm:max-w-md">
              {settings.tagline}
            </p>
          </div>
        </div>

        {/* Quick Search & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick IMEI / Customer Search Button */}
          <button
            id="btn-quick-imei-search"
            onClick={() => setIsImeiSearchOpen(true)}
            className="flex items-center gap-2 bg-[#161922] hover:bg-[#1E222E] text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700/70 text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Barcode className="w-4 h-4 text-cyan-400" />
            <span>Search IMEI / Customer</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#0D0E15] text-slate-400 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Install Mobile App / APK Button */}
          <button
            id="btn-install-mobile-app"
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/80 hover:to-indigo-800/80 text-blue-300 hover:text-white px-3 py-2 rounded-lg border border-blue-600/50 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Install ZAFAR MOBILE STORE app or APK on Mobile"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Install App (APK)</span>
          </button>

          {/* Backup & Spreadsheet Export Button */}
          <button
            id="btn-backup-sheets-export"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#171B26] hover:bg-[#202534] text-emerald-400 hover:text-emerald-300 px-3.5 py-2 rounded-lg border border-emerald-800/40 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Export Excel/Google Sheets & Backup Data to Gmail"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Backup & Sheets</span>
          </button>

          {/* Record Sale / POS Button */}
          <button
            id="btn-quick-pos-sale"
            onClick={() => setIsPosModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all cursor-pointer hover:shadow-emerald-600/25"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Quick Sale (POS)</span>
          </button>

          {/* Add Mobile Button */}
          <button
            id="btn-add-mobile"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-md shadow-blue-950/40 transition-all cursor-pointer hover:shadow-blue-600/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Mobile</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-[#0B0C12] border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-1.5 gap-2">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-blue-800 text-blue-100' : 'bg-[#181B26] text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mini Live Stock Stats */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 border-l border-slate-800 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>New: <strong className="text-slate-200">{newStockCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Used: <strong className="text-slate-200">{usedStockCount}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
