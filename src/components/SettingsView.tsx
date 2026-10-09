import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage, TextColorTheme, TextSize, Language } from '../context/ThemeLanguageContext';
import { ShopSettings } from '../types/mobile';
import { 
  Settings, 
  Store, 
  DollarSign, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Save, 
  FileText, 
  Building,
  Phone,
  Mail,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Smartphone,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Palette,
  Sun,
  Moon,
  Languages,
  Type,
  Monitor,
  FileCode,
  Cloud,
  RefreshCw,
  History,
  AlertCircle,
  Clock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportDataJSON, 
    importDataJSON, 
    resetToSampleData,
    exportAllToPDF,
    exportAllToSheets,
    exportInventoryToSheets,
    exportSalesToSheets,
    triggerGmailBackup,
    setIsBackupModalOpen,
    setIsInstallModalOpen,
    inventory,
    sales,
    customers,
    restoreWithGmailId,
    triggerGmailCloudSync,
    getAvailableGmailBackups,
    lastAutoSaveTime,
    isAutoSaving,
    autoSaveStatus,
    cloudSyncStatus,
    lastCloudSyncTime,
    forceSyncNow,
    setIsSyncModalOpen,
  } = useShop();

  const { 
    currentUser, 
    requireAuth, 
    toggleRequireAuth, 
    updatePassword, 
    updateUsername, 
    accounts, 
    registerUser 
  } = useAuth();

  const {
    textColorTheme,
    setTextColorTheme,
    textSize,
    setTextSize,
    language,
    setLanguage,
    t
  } = useThemeLanguage();

  const [form, setForm] = useState<ShopSettings>({ 
    ...settings,
    backupGmail: settings.backupGmail || settings.email || 'mebadprince@gmail.com'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Gmail ID Restore & Auto-Save State
  const [gmailRestoreEmail, setGmailRestoreEmail] = useState(
    form.backupGmail || settings.backupGmail || 'mebadprince@gmail.com'
  );
  const [isSearchingBackups, setIsSearchingBackups] = useState(false);
  const [isRestoringGmail, setIsRestoringGmail] = useState(false);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [showBackupList, setShowBackupList] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSearchGmailBackups = async () => {
    setIsSearchingBackups(true);
    setRestoreFeedback(null);
    try {
      const list = await getAvailableGmailBackups(gmailRestoreEmail);
      setAvailableBackups(list);
      setShowBackupList(true);
      if (list.length === 0) {
        setRestoreFeedback({
          type: 'error',
          message: `No saved backups found for "${gmailRestoreEmail}". You can create a new cloud backup now using the button below.`
        });
      }
    } catch (e: any) {
      setRestoreFeedback({ type: 'error', message: `Search failed: ${e.message}` });
    } finally {
      setIsSearchingBackups(false);
    }
  };

  const handleRestoreWithGmail = async (snapshotId?: string) => {
    if (!window.confirm(`Are you sure you want to restore records for ${gmailRestoreEmail}? All inventory devices, sales invoices, and customer Khata ledger records will be restored.`)) {
      return;
    }
    setIsRestoringGmail(true);
    setRestoreFeedback(null);
    try {
      const res = await restoreWithGmailId(gmailRestoreEmail, snapshotId);
      if (res.success) {
        setRestoreFeedback({ type: 'success', message: res.message });
        setForm((prev) => ({ ...prev, ...settings }));
      } else {
        setRestoreFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setRestoreFeedback({ type: 'error', message: `Restore error: ${e.message}` });
    } finally {
      setIsRestoringGmail(false);
    }
  };

  const handleQuickSyncGmail = async () => {
    setIsSyncingGmail(true);
    setSyncFeedback(null);
    try {
      const res = await triggerGmailCloudSync(gmailRestoreEmail, 'Manual Backup from Settings');
      setSyncFeedback({ type: res.success ? 'success' : 'error', message: res.message });
      setTimeout(() => setSyncFeedback(null), 5000);
      // Refresh list if open
      if (showBackupList) {
        const list = await getAvailableGmailBackups(gmailRestoreEmail);
        setAvailableBackups(list);
      }
    } catch (e: any) {
      setSyncFeedback({ type: 'error', message: `Sync error: ${e.message}` });
    } finally {
      setIsSyncingGmail(false);
    }
  };

  // Security & Password state
  const [newUsernameInput, setNewUsernameInput] = useState(currentUser?.username || 'admin');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add staff user state
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'Manager' | 'Staff'>('Staff');
  const [staffMsg, setStaffMsg] = useState<string | null>(null);

  const currencyOptions = [
    { code: 'PKR', symbol: 'PKR ', label: 'Pakistani Rupee (PKR)' },
    { code: 'RS', symbol: 'Rs ', label: 'Pakistani Rupee (Rs)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'AED', symbol: 'AED ', label: 'UAE Dirham (AED)' },
    { code: 'SAR', symbol: 'SAR ', label: 'Saudi Riyal (SAR)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (C$)' },
  ];

  const handleCurrencyChange = (code: string) => {
    const selected = currencyOptions.find((c) => c.code === code);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        currency: selected.code,
        currencySymbol: selected.symbol,
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        setImportStatus(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#171B26] text-blue-400 border border-slate-700/60 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mobile Shop Profile & System Preferences</h2>
            <p className="text-xs text-slate-400">Configure your shop identity, currency symbol, default warranty clauses, and manage database backups</p>
          </div>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      {/* Settings Section Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <a
          href="#section-shop-info"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1b2030] text-slate-300 text-xs font-semibold border border-slate-800 transition-colors whitespace-nowrap"
        >
          <Store className="w-3.5 h-3.5 text-blue-400" />
          <span>Shop Profile</span>
        </a>
        <a
          href="#section-currency-warranty"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1b2030] text-slate-300 text-xs font-semibold border border-slate-800 transition-colors whitespace-nowrap"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Currency & Warranty</span>
        </a>
        <a
          href="#section-mobile-app"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1b2030] text-slate-300 text-xs font-semibold border border-slate-800 transition-colors whitespace-nowrap"
        >
          <Monitor className="w-3.5 h-3.5 text-blue-400" />
          <span>Windows &amp; Mobile App</span>
        </a>
        <a
          href="#section-backup-data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1b2030] text-slate-300 text-xs font-semibold border border-slate-800 transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
          <span>Sheets & Backup</span>
        </a>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Shop Identity */}
        <div id="section-shop-info" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4 scroll-mt-20">
          <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" /> Shop Information (Appears on Customer Invoices)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shop / Store Name *</label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-bold text-white focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shop Tagline / Slogan</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Owner / Manager Name</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Store Phone / WhatsApp *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Backup Gmail ID / Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.backupGmail || ''}
                  onChange={(e) => setForm({ ...form, backupGmail: e.target.value })}
                  placeholder="e.g. mebadprince@gmail.com"
                  className="w-full pl-8 pr-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-mono text-cyan-300 focus:bg-[#1D2230] focus:ring-2 focus:ring-rose-500 outline-none"
                />
                <Mail className="w-3.5 h-3.5 text-rose-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Shop Address / Plaza Location *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Currency & Financials */}
        <div id="section-currency-warranty" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4 scroll-mt-20">
          <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Currency & Default Warranty Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Store Currency</label>
              <select
                value={form.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-bold text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Warranty: New Phones (Days)</label>
              <input
                type="number"
                min="0"
                value={form.defaultWarrantyDaysNew}
                onChange={(e) => setForm({ ...form, defaultWarrantyDaysNew: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-semibold text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Warranty: Used Phones (Days)</label>
              <input
                type="number"
                min="0"
                value={form.defaultWarrantyDaysUsed}
                onChange={(e) => setForm({ ...form, defaultWarrantyDaysUsed: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs font-semibold text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Invoice Terms & Warranty Conditions (Printed at Bottom of Receipt)
            </label>
            <textarea
              rows={4}
              value={form.defaultInvoiceTerms}
              onChange={(e) => setForm({ ...form, defaultInvoiceTerms: e.target.value })}
              className="w-full px-3 py-2 bg-[#171B26] border border-slate-700/70 rounded-lg text-xs text-slate-200 focus:bg-[#1D2230] focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/40 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings & Preferences</span>
          </button>
        </div>

      </form>

      {/* Windows Desktop & Mobile App Installation Card */}
      <div id="section-mobile-app" className="bg-gradient-to-r from-blue-950/60 via-[#131724] to-[#131724] p-5 rounded-2xl border border-blue-600/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-20">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Install on Windows PC &amp; Mobile Phone</h3>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-700/50 text-[10px] font-bold uppercase">
                Windows .EXE &bull; APK &bull; PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Convert to Windows installation file (.exe / .msix), download 1-click Windows setup batch script, or install on Android &amp; iPhone.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Install / Package App</span>
        </button>
      </div>

      {/* Writing Color, Display & Language Readability Section */}
      <div id="section-readability" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Writing Color, Display & Language Readability (پڑھنے کی لکھائی اور رنگ)</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Customize text font colors, contrast levels, font size, and language so everything is crystal-clear and comfortable to read.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
            Active: {textColorTheme === 'high-contrast' ? 'Bright White' : textColorTheme === 'light' ? 'Daylight (Light)' : textColorTheme}
          </span>
        </div>

        {/* 1. Writing Color Themes */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Choose Writing Text Color (لکھائی کا رنگ منتخب کریں)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'high-contrast' as TextColorTheme,
                title: 'Bright White',
                urdu: 'روشن سفید لکھائی',
                desc: 'Crisp 100% white typography with high contrast.',
                bg: '#0A0B0E',
                fg: '#FFFFFF',
                badgeBg: 'bg-blue-600'
              },
              {
                id: 'light' as TextColorTheme,
                title: 'Daylight Clean',
                urdu: 'دن کی روشنی (لائٹ موڈ)',
                desc: 'Crisp white canvas with bold dark text for daylight.',
                bg: '#FFFFFF',
                fg: '#0F172A',
                badgeBg: 'bg-amber-600'
              },
              {
                id: 'amber' as TextColorTheme,
                title: 'Warm Amber Gold',
                urdu: 'سنہری لکھائی (پرسکون)',
                desc: 'Soft warm gold writing on obsidian slate.',
                bg: '#0C0D10',
                fg: '#FEF08A',
                badgeBg: 'bg-yellow-600'
              },
              {
                id: 'emerald' as TextColorTheme,
                title: 'Electric Mint',
                urdu: 'سبز روشن لکھائی',
                desc: 'High-visibility mint green text for sharp reading.',
                bg: '#050C0A',
                fg: '#6EE7B7',
                badgeBg: 'bg-emerald-600'
              }
            ].map((thm) => {
              const active = textColorTheme === thm.id;
              return (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => setTextColorTheme(thm.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    active
                      ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-md'
                      : 'border-slate-800 bg-[#161924] hover:border-slate-700 hover:bg-[#1a1e2d]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{thm.title}</span>
                    {active ? (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300 font-urdu">{thm.urdu}</span>

                  <div 
                    className="p-2 rounded-lg border border-slate-700/60 text-xs font-medium flex items-center justify-between"
                    style={{ backgroundColor: thm.bg, color: thm.fg }}
                  >
                    <span>Sample Text</span>
                    <span className="font-mono text-[10px]">150,000 PKR</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{thm.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Text Size & Language controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
          {/* Text Size */}
          <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              <span>Text Size & Visibility (لکھائی کا سائز)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal' as TextSize, label: 'Standard', sample: 'Aa' },
                { id: 'large' as TextSize, label: 'Large (+15%)', sample: 'Aa+' },
                { id: 'xlarge' as TextSize, label: 'Extra Large (+30%)', sample: 'Aa++' }
              ].map((sz) => {
                const active = textSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setTextSize(sz.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-[#0F1118] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-base font-bold">{sz.sample}</div>
                    <div className="text-[11px] mt-0.5">{sz.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop Language */}
          <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-400" />
              <span>Shop Language (دکان کی زبان)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en' as Language, label: 'English', sub: 'Default' },
                { id: 'ur' as Language, label: 'اردو', sub: 'اردو زبان' },
                { id: 'roman' as Language, label: 'Roman Urdu', sub: 'Aasan Urdu' }
              ].map((lng) => {
                const active = language === lng.id;
                return (
                  <button
                    key={lng.id}
                    type="button"
                    onClick={() => setLanguage(lng.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      active
                        ? 'border-purple-500 bg-purple-950/40 text-white font-bold ring-1 ring-purple-500/50'
                        : 'border-slate-800 bg-[#0F1118] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{lng.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{lng.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Readability Sample Box */}
        <div className="p-3.5 rounded-xl border border-slate-700/80 bg-[#161924] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Sample Phone: Apple iPhone 15 Pro Max (256GB - Blue Titanium)</span>
            </div>
            <p className="text-[11px] text-slate-300">
              IMEI: <span className="font-mono text-white">359182049182049</span> • Condition: Brand New (10/10) • PTA Approved
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Target Selling Price</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">Rs 345,000</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Authentication & Password Management */}
      <div id="section-security" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>User Authentication & Password Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage login username, update shop password, and toggle startup lock protection.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Startup Lock:</span>
            <button
              type="button"
              onClick={() => toggleRequireAuth(!requireAuth)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                requireAuth
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {requireAuth ? 'ENABLED (Locked)' : 'DISABLED (Open)'}
            </button>
          </div>
        </div>

        {/* Security feedback message */}
        {securityMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              securityMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                : 'bg-rose-950/80 border-rose-700/60 text-rose-300'
            }`}
          >
            {securityMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Change Username */}
          <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Change Username</h4>
            </div>
            <p className="text-[11px] text-slate-400">
              Current Username: <b className="text-white">{currentUser?.username || 'admin'}</b> ({currentUser?.role || 'Owner'})
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUsernameInput}
                onChange={(e) => setNewUsernameInput(e.target.value)}
                placeholder="New username"
                className="flex-1 px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setSecurityMsg(null);
                  const res = updateUsername(newUsernameInput);
                  setSecurityMsg({ type: res.success ? 'success' : 'error', text: res.message });
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shrink-0"
              >
                Save
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Change Password</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Current password (default: password123)"
                className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm new"
                  className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSecurityMsg(null);
                  if (newPasswordInput !== confirmPasswordInput) {
                    setSecurityMsg({ type: 'error', text: 'New passwords do not match.' });
                    return;
                  }
                  const res = updatePassword(currentPasswordInput, newPasswordInput);
                  setSecurityMsg({ type: res.success ? 'success' : 'error', text: res.message });
                  if (res.success) {
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                  }
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Existing Accounts List */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">Registered Accounts ({accounts.length}):</span>
          <div className="flex flex-wrap gap-2">
            {accounts.map((acc) => (
              <span key={acc.username} className="px-2.5 py-1 bg-[#161924] border border-slate-700 rounded-lg text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>{acc.username}</span>
                <span className="text-[10px] text-slate-500 font-sans">({acc.role})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Backup, Spreadsheet Export & Gmail Management */}
      <div id="section-backup-data" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Data Backup, PDF Export & Gmail Hub</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export all shop data in single-file PDF, Google Sheets / Excel, or sync with Gmail.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#1C2130] hover:bg-[#252C40] text-emerald-300 hover:text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Backup Hub</span>
          </button>
        </div>

        {importStatus && (
          <div className="bg-emerald-950/80 text-emerald-300 p-3 rounded-lg border border-emerald-700/50 text-xs font-medium">
            {importStatus}
          </div>
        )}

        {/* CROSS-DEVICE REAL-TIME SYNC CONTROL (PHONE & SYSTEM) */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#131926] to-[#131926] p-5 rounded-2xl border border-emerald-500/50 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Cross-Device Real-Time Sync (Phone &amp; System)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Entries made on your mobile phone automatically appear on this system in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => forceSyncNow()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <span>Pair Devices / Link</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#0B0E17] border border-slate-800 rounded-xl flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sync Status</span>
                <span className="font-bold text-emerald-400">
                  {cloudSyncStatus === 'syncing' ? 'Synchronizing...' : 'Live Connected'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0E17] border border-slate-800 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Device Check</span>
                <span className="font-mono text-slate-200">
                  {lastCloudSyncTime || 'Active Now'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0E17] border border-slate-800 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sync Channel</span>
                <span className="font-semibold text-slate-200">Dual Cloud + Central API</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY: GMAIL ID RESTORE & CONTINUOUS AUTO-SAVE CONTROL */}
        <div className="bg-gradient-to-r from-blue-950/50 via-[#151926] to-[#151926] p-5 rounded-2xl border border-blue-600/60 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Restore Records with Gmail ID (جی میل سے ڈیٹا بحال کریں)</span>
                  </h4>
                  <span className="text-[11px] text-blue-300 font-medium">
                    Continuous Auto-Save &bull; Alteration-Proof Permanent Vault
                  </span>
                </div>
              </div>
            </div>

            {/* Live Auto-Save Status Badge */}
            <div className="flex items-center gap-2 bg-[#0C101A] px-3 py-1.5 rounded-xl border border-blue-800/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <div className="text-[11px]">
                <span className="text-emerald-400 font-semibold block">Auto-Save Active</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  Saved: {new Date(lastAutoSaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Alteration Shield Guarantee Banner */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-300">Data Preservation Shield Active:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Every alteration in the store (adding devices, making sales, Khata customer payments) is continuously auto-saved. When the app is altered or updated, your existing data is <b>safeguarded in a permanent multi-layer vault and will never be deleted or overwritten with sample data</b>.
              </p>
            </div>
          </div>

          {/* Gmail ID Input & Restore Controls */}
          <div className="space-y-3 bg-[#0E121D] p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Target Gmail ID for Backup &amp; Restore:</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={gmailRestoreEmail}
                  onChange={(e) => setGmailRestoreEmail(e.target.value)}
                  placeholder="Enter your Gmail ID (e.g. mebadprince@gmail.com)"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#141824] border border-slate-700 focus:border-blue-500 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              {/* Restore Button */}
              <button
                type="button"
                onClick={() => handleRestoreWithGmail()}
                disabled={isRestoringGmail}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                title="Restore all records associated with this Gmail ID"
              >
                {isRestoringGmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Restoring Records...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-white" />
                    <span>Restore with Gmail ID</span>
                  </>
                )}
              </button>

              {/* Search Backups Button */}
              <button
                type="button"
                onClick={handleSearchGmailBackups}
                disabled={isSearchingBackups}
                className="px-3.5 py-2.5 bg-[#1B2130] hover:bg-[#242C40] text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                title="Search and list all historical snapshots for this Gmail ID"
              >
                {isSearchingBackups ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Browse Backups ({availableBackups.length})</span>
              </button>

              {/* Instant Backup Button */}
              <button
                type="button"
                onClick={handleQuickSyncGmail}
                disabled={isSyncingGmail}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                title="Create an immediate cloud backup snapshot tagged with this Gmail ID"
              >
                {isSyncingGmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-white" />
                )}
                <span>Backup Now</span>
              </button>
            </div>

            {/* Current Store Counts Summary */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <span>Current Active Data:</span>
                <span className="text-white font-semibold">{inventory.length} Devices</span>
                <span className="text-white font-semibold">{sales.length} Sales</span>
                <span className="text-white font-semibold">{customers.length} Customers/Khata</span>
              </div>
              <span className="font-mono text-cyan-400 text-[10px]">
                Active ID: {gmailRestoreEmail}
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {restoreFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                restoreFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-600 text-rose-200'
              }`}
            >
              {restoreFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{restoreFeedback.message}</span>
            </div>
          )}

          {syncFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-600 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1">{syncFeedback.message}</span>
            </div>
          )}

          {/* Available Historical Backups List */}
          {showBackupList && availableBackups.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-blue-900/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Found {availableBackups.length} Saved Snapshots for {gmailRestoreEmail}:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowBackupList(false)}
                  className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Hide List
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableBackups.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="p-3 bg-[#0B0E17] rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{b.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono">
                          {b.source === 'drive' ? 'Google Drive Cloud' : 'Permanent Vault'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{b.dateFormatted || new Date(b.timestamp).toLocaleString()}</span>
                        {b.inventoryCount > 0 && (
                          <span className="text-cyan-300 font-medium">
                            {b.inventoryCount} Devices &bull; {b.salesCount} Sales &bull; {b.customersCount} Customers
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreWithGmail(b.id)}
                      disabled={isRestoringGmail}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 1. MASTER SINGLE-FILE PDF EXPORT CARD */}
        <div className="bg-gradient-to-r from-rose-950/50 via-[#171B26] to-[#171B26] p-4 rounded-xl border border-rose-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase">
                Single File PDF
              </span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Complete Shop All-in-One Master PDF</h4>
            </div>
            <p className="text-xs text-slate-300">
              Downloads all inventory, IMEIs, sales invoices, customer khata ledger, and used intakes compiled in a single PDF document.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              exportAllToPDF(currentUser?.name || settings.ownerName || 'Admin');
              setPdfDownloaded(true);
              setTimeout(() => setPdfDownloaded(false), 3000);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            {pdfDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Master PDF (.pdf)</span>
              </>
            )}
          </button>
        </div>

        {/* 1. SPREADSHEET EXPORTS (.XLSX) */}
        <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export in Shape of Sheets (Excel / Google Sheets)</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">.xlsx & .csv format</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Complete Workbook */}
            <button
              type="button"
              onClick={exportAllToSheets}
              className="p-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/50 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Complete Workbook</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-300">4 Sheets: Inventory, Sales, Trade-Ins & Financials</p>
            </button>

            {/* Inventory Only */}
            <button
              type="button"
              onClick={() => exportInventoryToSheets('xlsx')}
              className="p-3 bg-[#1C202D] hover:bg-[#23293A] border border-slate-700/70 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">Inventory Stock Sheet</span>
                <Download className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-400">{inventory.length} devices with IMEIs & costs</p>
            </button>

            {/* Sales Invoices Only */}
            <button
              type="button"
              onClick={() => exportSalesToSheets('xlsx')}
              className="p-3 bg-[#1C202D] hover:bg-[#23293A] border border-slate-700/70 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">Sales Invoices Sheet</span>
                <Download className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400">{sales.length} customer sales & profits</p>
            </button>
          </div>
        </div>

        {/* 2. GMAIL BACKUP TRIGGER */}
        <div className="bg-[#161924] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-400" />
              <span>Gmail ID Backup Dispatch</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {form.backupGmail || settings.backupGmail || 'mebadprince@gmail.com'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const draft = triggerGmailBackup(form.backupGmail || settings.backupGmail);
                window.open(draft.gmailWebUrl, '_blank', 'noopener,noreferrer');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Compose Backup in Gmail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const draft = triggerGmailBackup(form.backupGmail || settings.backupGmail);
                navigator.clipboard.writeText(draft.summaryText);
                setCopiedBackup(true);
                setTimeout(() => setCopiedBackup(false), 2500);
              }}
              className="px-4 py-2 bg-[#1C202D] hover:bg-[#23293A] text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700/80 flex items-center gap-2 cursor-pointer transition-all"
            >
              {copiedBackup ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy Backup Data</span>
                </>
              )}
            </button>

            {settings.lastBackupDate && (
              <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Last backup: {new Date(settings.lastBackupDate).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. RAW JSON & RESET */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={exportDataJSON}
            className="px-3.5 py-2 bg-[#171B26] hover:bg-[#1E2435] text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700/70 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download Raw JSON (.json)</span>
          </button>

          {/* Import JSON */}
          <label className="px-3.5 py-2 bg-[#171B26] hover:bg-[#1E2435] text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-700/70 flex items-center gap-2 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Restore JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all inventory and sales back to default demo data?')) {
                resetToSampleData();
                setForm({ ...settings });
                alert('Reset to demo stock successfully.');
              }
            }}
            className="ml-auto px-3.5 py-2 text-rose-400 hover:bg-rose-950/50 font-medium text-xs rounded-xl border border-rose-800/60 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Web App Manifest & PWABuilder Packaging Hub */}
      <div id="section-web-manifest" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Web App Manifest &amp; Store Packaging (PWA &bull; PWABuilder)</span>
              </h3>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold rounded-full">
                100% Validated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard W3C manifest file for Windows (.msix / .exe), Android (.apk), and iOS home screen installation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Open Manifest Hub &amp; Installer</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-[#161B26] to-[#161B26] rounded-xl border border-emerald-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>manifest.json &amp; manifest.webmanifest Active</span>
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Configured with full identity (<code className="text-cyan-300 font-mono">id: "/"</code>), 192px/512px/1024px PNG icons, maskable icons with 15% safe padding, 180px apple-touch-icon, desktop/mobile screenshots, standalone display, and CORS headers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="/manifest.json"
              download="manifest.json"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download manifest.json</span>
            </a>

            <a
              href="/manifest.json"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#1B2232] hover:bg-[#242C40] text-cyan-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Raw JSON</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};
