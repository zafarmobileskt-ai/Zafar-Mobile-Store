import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { 
  FileText,
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
  CheckCircle2,
  Cloud,
  CloudOff,
  AlertTriangle,
  Layers,
  Users
} from 'lucide-react';
import { 
  googleSignIn, 
  getCurrentUser, 
  logoutGoogle, 
  uploadBackupToDrive,
  getAccessToken 
} from '../services/googleDriveService';

export const BackupExportModal: React.FC = () => {
  const { 
    isBackupModalOpen, 
    setIsBackupModalOpen, 
    settings, 
    updateSettings, 
    inventory, 
    sales, 
    customers,
    exportAllToPDF,
    exportAllToSheets, 
    exportInventoryToSheets, 
    exportSalesToSheets, 
    exportCustomersToSheets,
    exportDataJSON, 
    importDataJSON,
    triggerGmailBackup,
    formatCurrency 
  } = useShop();

  const { currentUser: authUser } = useAuth();

  // Active tab: default to 'pdf' as requested: "Download format should b pdf, and all data should be in single file"
  const [activeTab, setActiveTab] = useState<'pdf' | 'drive' | 'gmail' | 'sheets' | 'json'>('pdf');

  const [gmailInput, setGmailInput] = useState<string>(
    settings.backupGmail || settings.email || 'mebadprince@gmail.com'
  );
  const [copied, setCopied] = useState(false);
  const [saveEmailSuccess, setSaveEmailSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Google Drive State
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUser, setDriveUser] = useState<any>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const user = getCurrentUser();
      setDriveUser(user);
    } catch {
      // Ignore if not initialized
    }
  }, [isBackupModalOpen]);

  if (!isBackupModalOpen) return null;

  const inStockCount = inventory.filter((i) => i.status === 'in_stock').length;
  const inStockValue = inventory
    .filter((i) => i.status === 'in_stock')
    .reduce((acc, i) => acc + (i.purchaseCost || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (s.finalAmount || 0), 0);
  const totalProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const usedCount = inventory.filter((i) => i.deviceType === 'used' || i.supplierOrSeller?.type === 'Walk-in Customer').length;

  const handleDownloadPDF = () => {
    setIsExportingPDF(true);
    setPdfDownloaded(false);
    setTimeout(() => {
      try {
        exportAllToPDF(authUser?.name || settings.ownerName || 'Admin');
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 4000);
      } catch (err: any) {
        console.error('PDF export failed:', err);
        alert('Could not export PDF: ' + (err.message || 'Unknown error'));
      } finally {
        setIsExportingPDF(false);
      }
    }, 100);
  };

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

  const handleCopyBackupText = () => {
    const draft = triggerGmailBackup(gmailInput.trim());
    navigator.clipboard.writeText(draft.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGoogleDriveSignIn = async () => {
    setIsDriveConnecting(true);
    setDriveError(null);
    setDriveSuccess(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setDriveUser(res.user);
        setDriveSuccess(`Successfully connected Google Account: ${res.user.email || 'Google User'}`);
      }
    } catch (err: any) {
      console.warn('Google Drive linking info:', err);
      // In web applet iframe environments, popups or cross-origin third-party auth may be restricted
      setDriveError(
        'Google popup was blocked or restricted by browser/iframe security. Use the "1-Click Download PDF & Open Drive" option below to store in Google Drive with zero restrictions!'
      );
    } finally {
      setIsDriveConnecting(false);
    }
  };

  const handleGoogleDriveUpload = async () => {
    setIsDriveUploading(true);
    setDriveError(null);
    setDriveSuccess(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Please sign in to Google first.');
      }
      const backupData = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        exportedAt: new Date().toLocaleString(),
        sourceApp: 'Zafar Mobile Store POS',
        metadata: {
          inventoryCount: inventory.length,
          salesCount: sales.length,
          customersCount: customers.length,
          shopName: settings.shopName || 'Zafar Mobile Store',
        },
        inventory,
        sales,
        customers,
        settings,
      };

      const res = await uploadBackupToDrive(backupData);
      setDriveSuccess(`Backup uploaded directly to your Google Drive! File: ${res.name}`);
    } catch (err: any) {
      console.warn('Google Drive upload info:', err);
      setDriveError(
        err.message || 'Upload failed. Download the Single PDF file and save directly to your Google Drive folder.'
      );
    } finally {
      setIsDriveUploading(false);
    }
  };

  const handleOpenGoogleDrive = () => {
    // Also trigger the PDF download so the user has the file ready to upload
    exportAllToPDF(authUser?.name || settings.ownerName || 'Admin');
    window.open('https://drive.google.com', '_blank', 'noopener,noreferrer');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12151E] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Backup & Data Export Center</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Single File PDF
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Download all store data in a single comprehensive PDF file, link cloud storage, or sync with Gmail
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 overflow-x-auto scrollbar-none bg-[#141722]">
          
          {/* TAB 1: PDF Master Single File */}
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pdf'
                ? 'border-rose-400 text-rose-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Master Single-File PDF</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          </button>

          {/* TAB 2: Google Drive */}
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'drive'
                ? 'border-blue-400 text-blue-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-400" />
            <span>Google Drive Sync</span>
          </button>

          {/* TAB 3: Gmail */}
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'gmail'
                ? 'border-amber-400 text-amber-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Gmail Sync</span>
          </button>

          {/* TAB 4: Spreadsheets */}
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'sheets'
                ? 'border-emerald-400 text-emerald-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel / Sheets</span>
          </button>

          {/* TAB 5: JSON */}
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'json'
                ? 'border-purple-400 text-purple-300 bg-[#1A1E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>Raw JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#10131C]">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#171B26] p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Inventory</span>
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
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Customers</span>
              <p className="text-sm font-bold text-purple-400">{customers.length} Profiles</p>
            </div>
          </div>

          {/* TAB 1: MASTER SINGLE-FILE PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-5">
              {/* Main PDF Download Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#171B26] to-[#171B26] border border-rose-600/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Recommended Format</span>
                      </span>
                      <h3 className="text-base font-black text-white">All Data in Single PDF File</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Generates a complete, structured, print-ready PDF containing <b>all 4 store modules in a single master document</b>. Perfect for daily audit, offline physical archives, tax reporting, or WhatsApp sharing.
                    </p>
                  </div>

                  <button
                    id="btn-download-master-pdf"
                    onClick={handleDownloadPDF}
                    disabled={isExportingPDF}
                    className="px-5 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-rose-950/80 flex items-center justify-center gap-2.5 cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isExportingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Generating PDF...</span>
                      </>
                    ) : pdfDownloaded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-200">Downloaded Master PDF!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Single PDF File (.pdf)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Structured Sections Inside the Single File */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    What is compiled inside this Single PDF:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-[#11141E] rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <b className="text-white block">1. Inventory & Stock Directory</b>
                        <span className="text-[11px] text-slate-400">{inventory.length} devices with IMEIs, specs, PTA status, costs & retail prices.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#11141E] rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <b className="text-white block">2. POS Sales & Invoices Record</b>
                        <span className="text-[11px] text-slate-400">{sales.length} transactions with invoice numbers, customer names, profits & payment methods.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#11141E] rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-950/80 text-purple-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <b className="text-white block">3. Customer Directory & Khata Ledger</b>
                        <span className="text-[11px] text-slate-400">{customers.length} customer profiles with net balances, receivables (udhar), and contact numbers.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#11141E] rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <b className="text-white block">4. Used Intakes & Police Protection</b>
                        <span className="text-[11px] text-slate-400">{usedCount} pre-owned devices with previous seller CNIC/ID, phone, and verification check status.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Standard A4 Landscape formatting • Works 100% offline</span>
                  <span className="text-emerald-400 font-semibold">● Instant Client-side Download</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE LINK & SYNC */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              
              {/* Google Drive Status Banner */}
              <div className="p-4 bg-[#151926] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Google Drive Connection Status
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {driveUser ? `Linked to Google Account: ${driveUser.email || 'Active'}` : 'Not linked to Google Drive yet'}
                      </p>
                    </div>
                  </div>

                  {driveUser ? (
                    <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Linked</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-950/80 text-amber-400 border border-amber-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CloudOff className="w-3.5 h-3.5" />
                      <span>Unlinked</span>
                    </span>
                  )}
                </div>

                {driveError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-rose-300">Why Google Drive did not link directly:</p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        In web containers and mobile browser tabs, Google blocks popups and third-party cookies for security. 
                        <b>No problem!</b> Use the 1-click option below to save your Master Single PDF and open your Google Drive directly.
                      </p>
                    </div>
                  </div>
                )}

                {driveSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{driveSuccess}</span>
                  </div>
                )}

                {/* Primary Action Buttons for Google Drive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Option A: Reliable 1-Click Save PDF + Open Drive */}
                  <div className="p-3.5 bg-[#10131D] rounded-xl border border-blue-600/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">Guaranteed</span>
                      <span>1-Click Save PDF & Open Google Drive</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Downloads the single master PDF file and immediately opens your Google Drive tab so you can drop it into your folder.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenGoogleDrive}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-blue-900/40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF & Launch Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Option B: Direct OAuth Link */}
                  <div className="p-3.5 bg-[#10131D] rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                      <span>Direct Google Account Sign In</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Connects your Google Account token directly to automatically write backups to your Drive folder.
                    </p>
                    {driveUser ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleGoogleDriveUpload}
                          disabled={isDriveUploading}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>{isDriveUploading ? 'Uploading...' : 'Upload Now to Drive'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={logoutGoogle}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoogleDriveSignIn}
                        disabled={isDriveConnecting}
                        className="w-full py-2.5 bg-[#1C2130] hover:bg-[#252C40] text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-700/80 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Cloud className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isDriveConnecting ? 'Connecting...' : 'Sign In with Google ID'}</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GMAIL SYNC */}
          {activeTab === 'gmail' && (
            <div className="space-y-5">
              
              {/* Configure Gmail ID */}
              <div className="p-4 bg-[#161A26] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Your Gmail Address for Data Sync</span>
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
                      className="w-full px-3 py-2 bg-[#0F1118] border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all shrink-0"
                  >
                    Save Email ID
                  </button>
                </form>
                <p className="text-[11px] text-slate-400">
                  Data summaries, stock valuation, and audit records will be formatted and addressed to this email address.
                </p>
              </div>

              {/* One-Click Backup Trigger Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Launch Gmail Web Composer */}
                <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/40">
                        <Mail className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs font-bold text-white">Open Gmail Sync Composer</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Opens Gmail with your email address, subject line, active phone stock, financial overview, and customer dues pre-filled.
                    </p>
                  </div>
                  <button
                    onClick={handleLaunchGmailBackup}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Sync & Compose in Gmail</span>
                  </button>
                </div>

                {/* Copy Formatted Backup Text */}
                <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                        <Copy className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs font-bold text-white">Copy Summary & Records</h4>
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
                        <span>Copy Summary Text</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Attachment Advice Note */}
              <div className="p-3 bg-[#0F1118] rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <b>Pro Tip for Gmail:</b> Click <b>"Download Single PDF File"</b> from the first tab, then drag and drop the downloaded PDF file into your Gmail compose window to send yourself a complete, tamper-proof archive!
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: SPREADSHEETS (EXCEL / CSV) */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              
              {/* Primary Full Shop Multi-Sheet Workbook */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-[#171B26] to-[#171B26] border border-emerald-600/40 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Complete Shop Multi-Sheet Workbook (.xlsx)</h3>
                    <p className="text-xs text-slate-300">
                      Exports all shop records in an organized Excel file containing 4 structured tabs (Inventory, Invoices, Customers, Used Intakes).
                    </p>
                  </div>
                  <button
                    onClick={() => exportAllToSheets()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download (.xlsx)</span>
                  </button>
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
                    Export stock list ({inventory.length} units) with IMEI numbers, purchase costs, and retail prices.
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
                    Export customer sales records ({sales.length} invoices) with payment methods and profit margins.
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

            </div>
          )}

          {/* TAB 5: RAW JSON BACKUP */}
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
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Master PDF format contains complete shop records in a single self-contained file</span>
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
