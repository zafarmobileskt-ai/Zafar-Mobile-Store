import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  FileSpreadsheet, 
  Mail, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  Smartphone, 
  Receipt, 
  Database, 
  X,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

export const BackupExportModal: React.FC = () => {
  const { 
    isBackupModalOpen, 
    setIsBackupModalOpen, 
    settings, 
    updateSettings, 
    inventory, 
    sales, 
    exportAllToSheets, 
    exportInventoryToSheets, 
    exportSalesToSheets, 
    exportDataJSON, 
    importDataJSON,
    triggerGmailBackup,
    formatCurrency 
  } = useShop();

  const [gmailInput, setGmailInput] = useState<string>(
    settings.backupGmail || settings.email || 'mebadprince@gmail.com'
  );
  const [copied, setCopied] = useState(false);
  const [saveEmailSuccess, setSaveEmailSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheets' | 'gmail' | 'json'>('sheets');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isBackupModalOpen) return null;

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const inStockValue = inventory
    .filter((i) => i.status === 'in_stock')
    .reduce((acc, i) => acc + (i.purchaseCost || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
  const totalProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);

  const handleSaveGmail = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ backupGmail: gmailInput.trim() });
    setSaveEmailSuccess(true);
    setTimeout(() => setSaveEmailSuccess(false), 2500);
  };

  const handleLaunchGmailBackup = () => {
    const draft = triggerGmailBackup(gmailInput.trim());
    window.open(draft.gmailWebUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLaunchMailtoBackup = () => {
    const draft = triggerGmailBackup(gmailInput.trim());
    window.location.href = draft.mailtoUrl;
  };

  const handleCopyBackupText = () => {
    const draft = triggerGmailBackup(gmailInput.trim());
    navigator.clipboard.writeText(draft.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151E] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Backup & Spreadsheet Export Hub</span>
              </h2>
              <p className="text-xs text-slate-400">
                Export shop stock & sales to Google Sheets / Excel, or send automated backups to your Gmail
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-[#141722]">
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-emerald-400 text-emerald-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Spreadsheet Export (Sheets / Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'border-rose-400 text-rose-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Gmail / Email Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'border-blue-400 text-blue-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>Raw Database JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#10131C]">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#171B26] p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active In-Stock</span>
              <p className="text-sm font-bold text-white">{inStockCount} Phones</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Stock Valuation</span>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(inStockValue)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Invoices</span>
              <p className="text-sm font-bold text-cyan-300">{sales.length} Sales</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Profit</span>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalProfit)}</p>
            </div>
          </div>

          {/* TAB 1: SPREADSHEETS EXPORT */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              
              {/* Primary Full Shop Multi-Sheet Workbook */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-[#171B26] to-[#171B26] border border-emerald-600/40 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        Recommended
                      </span>
                      <h3 className="text-sm font-bold text-white">Complete Shop Multi-Sheet Workbook (.xlsx)</h3>
                    </div>
                    <p className="text-xs text-slate-300">
                      Exports all shop records in an organized Excel file containing 4 structured tabs:
                    </p>
                  </div>
                  <button
                    onClick={() => exportAllToSheets()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All Sheets (.xlsx)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2.5 bg-[#12151E] rounded-lg border border-slate-800 text-xs">
                    <span className="font-bold text-emerald-400 block mb-0.5">Sheet 1: Inventory</span>
                    <span className="text-[11px] text-slate-400">All phones, IMEIs, costs, grades & prices</span>
                  </div>
                  <div className="p-2.5 bg-[#12151E] rounded-lg border border-slate-800 text-xs">
                    <span className="font-bold text-cyan-400 block mb-0.5">Sheet 2: Invoices</span>
                    <span className="text-[11px] text-slate-400">Customer details, paid amounts & profits</span>
                  </div>
                  <div className="p-2.5 bg-[#12151E] rounded-lg border border-slate-800 text-xs">
                    <span className="font-bold text-purple-400 block mb-0.5">Sheet 3: Used/Trade-ins</span>
                    <span className="text-[11px] text-slate-400">Seller details, CNIC & condition checks</span>
                  </div>
                  <div className="p-2.5 bg-[#12151E] rounded-lg border border-slate-800 text-xs">
                    <span className="font-bold text-amber-400 block mb-0.5">Sheet 4: Financials</span>
                    <span className="text-[11px] text-slate-400">Stock valuation & net margin summary</span>
                  </div>
                </div>
              </div>

              {/* Individual Sheet Exports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Inventory Only */}
                <div className="p-4 bg-[#151924] rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Inventory Stock Sheet</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export current active stock list ({inventory.length} total units) with IMEI numbers, purchase costs, and retail prices.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => exportInventoryToSheets('xlsx')}
                      className="flex-1 px-3 py-2 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-semibold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => exportInventoryToSheets('csv')}
                      className="px-3 py-2 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-semibold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Sales Invoices Only */}
                <div className="p-4 bg-[#151924] rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sales Invoices Sheet</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Export all customer sales records ({sales.length} transactions) with warranty terms, payment methods, and profit calculations.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => exportSalesToSheets('xlsx')}
                      className="flex-1 px-3 py-2 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-semibold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => exportSalesToSheets('csv')}
                      className="px-3 py-2 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-semibold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* How to Open in Google Sheets Box */}
              <div className="p-3.5 bg-[#141722] rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">How to view in Google Sheets:</span>
                  <p className="text-slate-400 leading-relaxed">
                    1. Click <b>"Download All Sheets (.xlsx)"</b> above to save the file.<br />
                    2. Go to <b>Google Sheets</b> (<a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">sheets.google.com</a>) &gt; Click <b>File</b> &gt; <b>Import</b> &gt; <b>Upload</b>.<br />
                    3. All formatted sheets, IMEI strings, and columns will load cleanly.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GMAIL / EMAIL BACKUP */}
          {activeTab === 'gmail' && (
            <div className="space-y-5">
              
              {/* Configure Gmail ID */}
              <div className="p-4 bg-[#161A26] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-400" />
                    <span>Your Gmail Address for Backups</span>
                  </h3>
                  {saveEmailSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Gmail ID Saved!</span>
                    </span>
                  )}
                </div>
                
                <form onSubmit={handleSaveGmail} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={gmailInput}
                      onChange={(e) => setGmailInput(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:ring-2 focus:ring-rose-500 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all shrink-0"
                  >
                    Save Email ID
                  </button>
                </form>
                <p className="text-[11px] text-slate-400">
                  Data backups and store financial summaries will be formatted and addressed to this email address.
                </p>
              </div>

              {/* One-Click Backup Trigger Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Launch Gmail Web Composer */}
                <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/40">
                        <Mail className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs font-bold text-white">Open Gmail Web Composer</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Opens Gmail with your backup email, subject line, inventory count, financial overview, and database payload pre-filled.
                    </p>
                  </div>
                  <button
                    onClick={handleLaunchGmailBackup}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Compose in Gmail</span>
                  </button>
                </div>

                {/* Copy Formatted Backup Text */}
                <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                        <Copy className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs font-bold text-white">Copy Backup to Clipboard</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Copies complete summary and raw backup records to your clipboard to paste into WhatsApp, Notes, or any email client.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyBackupText}
                    className="w-full py-2.5 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy Summary & Data</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Last Backup Record Indicator */}
              <div className="p-3 bg-[#0F1118] rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Last Backup Status:</span>
                  <span className="font-semibold text-slate-200">
                    {settings.lastBackupDate
                      ? new Date(settings.lastBackupDate).toLocaleString()
                      : 'No backup recorded yet'}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded text-[10px] font-bold">
                  Secure Local Sync Active
                </span>
              </div>

            </div>
          )}

          {/* TAB 3: RAW JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                You can save a raw `.json` file of your shop records or restore from a previously exported JSON backup.
              </p>

              {importStatus && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-xs font-semibold text-emerald-300">
                  {importStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={exportDataJSON}
                  className="px-4 py-2.5 bg-[#171B26] hover:bg-[#1F2536] text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download Backup File (.json)</span>
                </button>

                <label className="px-4 py-2.5 bg-[#171B26] hover:bg-[#1F2536] text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Restore from JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141722] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compatible with Microsoft Excel, Google Sheets, and LibreOffice</span>
          </span>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
