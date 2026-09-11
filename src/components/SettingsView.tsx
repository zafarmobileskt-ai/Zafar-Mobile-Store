import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
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
  Smartphone
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportDataJSON, 
    importDataJSON, 
    resetToSampleData,
    exportAllToSheets,
    exportInventoryToSheets,
    exportSalesToSheets,
    triggerGmailBackup,
    setIsBackupModalOpen,
    setIsInstallModalOpen,
    inventory,
    sales
  } = useShop();

  const [form, setForm] = useState<ShopSettings>({ 
    ...settings,
    backupGmail: settings.backupGmail || settings.email || 'mebadprince@gmail.com'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const currencyOptions = [
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'PKR', symbol: 'Rs ', label: 'Pakistani Rupee (Rs)' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'AED', symbol: 'AED ', label: 'UAE Dirham (AED)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'SAR', symbol: 'SAR ', label: 'Saudi Riyal (SAR)' },
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
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Mobile App / APK</span>
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

      {/* Mobile App & APK Installation Card */}
      <div id="section-mobile-app" className="bg-gradient-to-r from-blue-950/50 via-[#131724] to-[#131724] p-5 rounded-2xl border border-blue-700/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 scroll-mt-20">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Install ZAFAR MOBILE STORE on Phone</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px] font-bold uppercase">
                APK & WebAPK Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Install the standalone app to your mobile phone home screen with camera barcode scanning and full offline support.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install App / APK</span>
        </button>
      </div>

      {/* Backup, Spreadsheet Export & Gmail Management */}
      <div id="section-backup-data" className="bg-[#12151E] p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Data Backup, Sheets Export & Gmail Hub</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export stock & invoices in shape of Google Sheets / Excel, or trigger instant backup emails to your Gmail ID.
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

    </div>
  );
};
