import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ReadabilityModal } from './ReadabilityModal';
import { 
  Boxes, 
  ReceiptText, 
  Smartphone, 
  Users, 
  TrendingUp, 
  SlidersHorizontal, 
  Barcode, 
  Store,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  Zap,
  Package,
  Activity,
  ShieldCheck,
  User,
  LogOut,
  Check,
  Palette,
  Sun,
  Moon,
  Eye,
  Languages,
  Monitor,
  Download,
  RefreshCw,
  Sparkles
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
    setIsVoiceAssistantOpen,
    exportAllToPDF,
    inventory,
    sales,
    customers,
    lastAutoSaveTime,
    cloudSyncStatus,
    lastCloudSyncTime,
    setIsSyncModalOpen,
    syncNotification,
    clearSyncNotification,
  } = useShop();

  const { currentUser, logout, requireAuth } = useAuth();
  const { textColorTheme, language, t } = useThemeLanguage();
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isReadabilityModalOpen, setIsReadabilityModalOpen] = useState(false);

  const handleQuickPDF = () => {
    try {
      exportAllToPDF(currentUser?.name || settings.ownerName || 'Admin');
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (e: any) {
      alert('Could not generate PDF: ' + e.message);
    }
  };

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const newStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'new').length;
  const usedStockCount = inventory.filter((i) => i.status === 'in_stock' && i.deviceType === 'used').length;

  // Logical retail menu order with distinctive icons, sublabels, and color accents
  const navItems = [
    { 
      id: 'inventory', 
      label: t('inventory', 'Inventory Hub'), 
      sublabel: language === 'ur' ? 'اسٹاک اور آئی ایم ای آئی' : 'Stock & IMEIs',
      icon: Boxes, 
      badge: inStockCount,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      activeColor: 'from-sky-600 to-blue-600 text-white shadow-sky-500/20'
    },
    { 
      id: 'invoices', 
      label: t('invoices', 'POS & Invoices'), 
      sublabel: language === 'ur' ? 'سیل اور بلنگ' : 'Sales & Billing',
      icon: ReceiptText, 
      badge: sales.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      activeColor: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
    },
    { 
      id: 'intake', 
      label: t('intake', 'Buy Used Intake'), 
      sublabel: language === 'ur' ? 'پولیس تصدیق و چیکنگ' : 'Testing & Police Cert',
      icon: Smartphone, 
      badge: usedStockCount > 0 ? `${usedStockCount} used` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activeColor: 'from-amber-600 to-orange-600 text-white shadow-amber-500/20'
    },
    { 
      id: 'customers', 
      label: t('customers', 'Customers & Khata'), 
      sublabel: language === 'ur' ? 'کھاتہ اور بقایا ادھار' : 'Ledger & Accounts',
      icon: Users, 
      badge: customers.length,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      activeColor: 'from-purple-600 to-indigo-600 text-white shadow-purple-500/20'
    },
    { 
      id: 'analytics', 
      label: t('analytics', 'Profit & Reports'), 
      sublabel: language === 'ur' ? 'منافع اور رپورٹس' : 'Margins & Analytics',
      icon: TrendingUp, 
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      activeColor: 'from-rose-600 to-pink-600 text-white shadow-rose-500/20'
    },
    { 
      id: 'settings', 
      label: t('settings', 'Shop Settings'), 
      sublabel: language === 'ur' ? 'دکان کی سیٹنگز' : 'Config & Backup',
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
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/50 hover:bg-blue-900/80 cursor-pointer transition-all"
                title={`All changes auto-saved to Vault & Gmail (${settings.backupGmail || 'mebadprince@gmail.com'}) - Click to view Backup & Restore`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="truncate max-w-[130px] lg:max-w-[200px]">Auto-saved ({settings.backupGmail || 'mebadprince@gmail.com'})</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 font-normal truncate max-w-xs sm:max-w-md">
              {settings.tagline || 'Mobile Inventory, IMEI Diagnostics & Khata Ledger'}
            </p>
          </div>
        </div>

        {/* Quick Search & Primary POS Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Gemini 3.8 Live Voice Assistant Button */}
          <button
            id="btn-voice-assistant-header"
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-pink-950/80 hover:from-purple-900 hover:to-indigo-900 text-purple-200 hover:text-white px-3.5 py-2 rounded-xl border border-purple-500/50 text-xs font-semibold transition-all shadow-sm cursor-pointer group"
            title="Real-time Voice Conversation with Gemini 3.8 Live"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span className="hidden xs:inline">Voice AI</span>
            <span className="xs:hidden">Voice</span>
            <span className="hidden md:inline-block px-1.5 py-0.2 bg-purple-900/60 text-purple-200 text-[10px] font-bold rounded border border-purple-700/60">
              Live
            </span>
          </button>

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

          {/* Install App (Windows .EXE / Desktop & Mobile) Button */}
          <button
            id="btn-install-mobile-app"
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-950/70 via-sky-950/70 to-indigo-950/70 hover:from-blue-900/80 hover:to-indigo-900/80 text-sky-300 hover:text-white px-3 py-2 rounded-xl border border-sky-600/50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Install on Windows PC (.EXE / Desktop App) or Mobile (APK / iOS)"
          >
            <Monitor className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">Install (Windows &amp; Mobile)</span>
            <span className="lg:hidden">Install</span>
          </button>

          {/* Single-File Master PDF Download Button */}
          <button
            id="btn-download-master-pdf-header"
            onClick={handleQuickPDF}
            className="flex items-center gap-1.5 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 hover:text-white px-3 py-2 rounded-xl border border-rose-700/50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Download all store data in a single comprehensive PDF file"
          >
            {pdfSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>PDF Saved!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Export All (PDF)</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>

          {/* Real-time Phone & PC Cloud Sync Status Button */}
          <button
            id="btn-cloud-sync-status"
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold shadow-xs transition-all cursor-pointer ${
              cloudSyncStatus === 'syncing'
                ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                : cloudSyncStatus === 'offline'
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                : 'bg-[#121b22] hover:bg-[#182632] border-emerald-500/40 text-emerald-400'
            }`}
            title="Real-time Cross-Device Synchronization between Mobile Phone and System"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                cloudSyncStatus === 'syncing' ? 'bg-indigo-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                cloudSyncStatus === 'syncing' ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span className="hidden sm:inline">
              {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Phone & PC Synced'}
            </span>
            <span className="sm:hidden">Sync</span>
          </button>

          {/* Backup Center & Google Drive Button */}
          <button
            id="btn-backup-sheets-export"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#151824] hover:bg-[#1e2333] text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-xl border border-emerald-800/40 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Export Excel/Google Sheets & Backup Data to Gmail / Drive"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden lg:inline">Backup Hub</span>
          </button>

          {/* Writing Color, Contrast & Language Readability Button */}
          <button
            id="btn-writing-color-mode"
            onClick={() => setIsReadabilityModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-blue-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 text-amber-300 hover:text-white px-3 py-2 rounded-xl border border-amber-500/40 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Change writing color, high-contrast readability, text size, and shop language"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t('writingColorLabel', 'Writing Color')}</span>
            <span className="sm:hidden">Font</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 text-[10px] font-mono uppercase tracking-wide">
              {textColorTheme === 'high-contrast' ? 'White' : textColorTheme === 'light' ? 'Day' : textColorTheme}
            </span>
          </button>

          {/* User Account / Lock Session Pill */}
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-[#141724] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-bold text-white max-w-[90px] truncate">{currentUser.name}</span>
                <span className="text-[9px] text-slate-400">{currentUser.role}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Lock / Log Out of application"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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

      {/* Live Cross-Device Sync Incoming Notification Banner */}
      {syncNotification && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white">{syncNotification}</span>
            <span className="text-emerald-400/80 hidden sm:inline">• Live data refreshed from cloud</span>
          </div>
          <button
            onClick={clearSyncNotification}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-emerald-900/60 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Writing Color, Display Contrast & Language Modal */}
      <ReadabilityModal 
        isOpen={isReadabilityModalOpen} 
        onClose={() => setIsReadabilityModalOpen(false)} 
      />
    </header>
  );
};
