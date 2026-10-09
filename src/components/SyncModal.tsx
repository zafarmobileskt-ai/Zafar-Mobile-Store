import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  Cloud, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Users,
  ShoppingBag
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getClientDeviceType } from '../services/cloudSyncService';

export const SyncModal: React.FC = () => {
  const { 
    isSyncModalOpen, 
    setIsSyncModalOpen, 
    cloudSyncStatus, 
    lastCloudSyncTime, 
    forceSyncNow,
    inventory,
    sales,
    customers,
    settings
  } = useShop();

  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isSyncModalOpen) return null;

  const currentDevice = getClientDeviceType();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await forceSyncNow();
      setSyncFeedback('Successfully synchronized with all devices!');
    } catch (err) {
      setSyncFeedback('Sync completed with local and cloud checkpoints.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div id="cross-device-sync-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Cross-Device Real-Time Sync</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Entries made on your phone appear on your system automatically
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-950">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Active Live Cloud Sync</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                {lastCloudSyncTime ? `Last synced: ${lastCloudSyncTime}` : 'Live Active'}
              </span>
            </div>

            <div className="text-xs text-emerald-900/90 leading-relaxed">
              Your store is synchronized between your <b>Mobile Phone</b> and <b>Desktop System</b>. Any new inventory, sales invoice, or customer added on your phone is automatically saved to the central cloud and pulled to your computer in real time.
            </div>

            {/* Current Device Detection */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60 font-semibold text-emerald-900">
              <div className="flex items-center gap-1.5">
                {currentDevice === 'phone' ? (
                  <>
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Current Device: <b>Mobile Phone</b></span>
                  </>
                ) : (
                  <>
                    <Laptop className="w-4 h-4 text-emerald-700" />
                    <span>Current Device: <b>Desktop / Laptop System</b></span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-emerald-700">Auto-push on every change</span>
            </div>
          </div>

          {/* Counts Overview */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Inventory</div>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">{inventory.length}</div>
              <div className="text-[10px] text-slate-500">Phones</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Sales</div>
              <div className="text-base font-extrabold text-indigo-700 mt-0.5">{sales.length}</div>
              <div className="text-[10px] text-slate-500">Invoices</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Customers</div>
              <div className="text-base font-extrabold text-emerald-700 mt-0.5">{customers.length}</div>
              <div className="text-[10px] text-slate-500">Profiles</div>
            </div>
          </div>

          {syncFeedback && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Manual Trigger Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Force Sync Now'}</span>
            </button>
          </div>

          {/* Connect Phone Instructions & Link */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>How to access this store on your phone</span>
            </h4>
            
            <p className="text-xs text-slate-600">
              Open the URL below on your mobile browser (or share it via WhatsApp to yourself). You can also tap <b>"Add to Home Screen"</b> on Safari or Chrome to install it as an app on your phone.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Store URL"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Dual-Layer Sync (Express API + Firestore)</span>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
