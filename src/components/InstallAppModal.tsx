import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Smartphone, 
  Download, 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Apple, 
  CheckCircle2, 
  Sparkles,
  Send,
  Camera,
  MessageCircle,
  Laptop
} from 'lucide-react';

export const InstallAppModal: React.FC = () => {
  const { isInstallModalOpen, setIsInstallModalOpen, settings } = useShop();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'android' | 'ios' | 'apk'>('scan');

  // Direct shared live URL for phone access
  const sharedUrl = 'https://ais-pre-5rqxp63fkivomm7hhrxvoc-243110999915.asia-southeast1.run.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : sharedUrl;
  const bestUrl = currentUrl.includes('localhost') ? sharedUrl : currentUrl;

  // Listen for beforeinstallprompt event on Android/Chrome
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalledSuccess(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (!isInstallModalOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      alert('To install on your mobile phone:\n1. Open this link in Google Chrome\n2. Tap the ⋮ menu at top-right\n3. Tap "Install App" or "Add to Home Screen"');
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstalledSuccess(true);
    }
    setDeferredPrompt(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Open and install ${settings.shopName} app on your phone: ${bestUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(bestUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#11141E] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950/80 border border-blue-600/50 rounded-xl text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Install {settings.shopName} on Your Phone
                </h2>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px] font-bold rounded-full uppercase">
                  PWA & APK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan QR with camera or open the link directly on your Android or iPhone
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInstallModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-[#131622] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'border-cyan-400 text-cyan-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'border-emerald-400 text-emerald-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android (Chrome)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'border-purple-400 text-purple-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4 text-purple-400" />
            <span>iPhone / Safari</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'border-blue-400 text-blue-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>APK Package (.apk)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#0F121B]">
          
          {/* TAB 0: SCAN QR CODE WITH PHONE CAMERA */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-[#161B26] to-[#161B26] rounded-2xl border border-cyan-700/50 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Scan to Install on Phone"
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <Camera className="w-3.5 h-3.5" /> Instant Mobile Connect
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      1. Scan this QR Code with your Phone Camera
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Point your phone's camera app or QR scanner at the screen. Tap the link popup to open the app directly on your phone.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 bg-[#1E2536] hover:bg-[#273046] text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy Phone Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send to WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct App Link Display */}
              <div className="p-3.5 bg-[#141824] rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Direct Mobile URL:</span>
                  <p className="font-mono text-xs text-cyan-300 truncate select-all">
                    {bestUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 bg-[#1F2538] hover:bg-[#2A324A] text-slate-200 rounded-lg text-xs shrink-0 cursor-pointer"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Step Install Process */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-cyan-400">Step 1: Scan & Open</span>
                  <p className="text-[11px] text-slate-400">Scan QR or open the shared link on your Android or iPhone.</p>
                </div>
                <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-emerald-400">Step 2: Tap Menu / Share</span>
                  <p className="text-[11px] text-slate-400">Tap <b>⋮</b> (Chrome) or <b>Share icon</b> (Safari).</p>
                </div>
                <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-purple-400">Step 3: Install App</span>
                  <p className="text-[11px] text-slate-400">Tap <b>"Install App"</b> or <b>"Add to Home Screen"</b>.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ANDROID WEBPK */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              
              {/* Native Install Button Trigger */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-[#161B26] to-[#161B26] rounded-xl border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                      <Zap className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white">Direct Android App Installation</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    Android installs the official <b>{settings.shopName}</b> app with camera barcode scanner, offline persistence, and full screen experience.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstallable ? 'Install Android App' : 'Add App to Home Screen'}</span>
                </button>
              </div>

              {installedSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settings.shopName} is installed on your device! You can launch it from your home screen.</span>
                </div>
              )}

              {/* 3 Step Android Guide */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>How to Install via Google Chrome on Android</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[11px] font-bold flex items-center justify-center">1</span>
                    <p className="text-xs font-semibold text-white">Open in Chrome</p>
                    <p className="text-[11px] text-slate-400">Open the app link on Google Chrome on your phone.</p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[11px] font-bold flex items-center justify-center">2</span>
                    <p className="text-xs font-semibold text-white">Tap Menu (⋮)</p>
                    <p className="text-[11px] text-slate-400">Tap the three vertical dots in the top-right corner of Chrome.</p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold flex items-center justify-center">3</span>
                    <p className="text-xs font-semibold text-white">Tap "Install App"</p>
                    <p className="text-[11px] text-slate-400">Tap <b>Install app</b> or <b>Add to Home screen</b> to install.</p>
                  </div>
                </div>
              </div>

              {/* Share URL to Mobile */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-white">Send App Link to your Phone</span>
                  <p className="text-[11px] text-slate-400">Send direct link to yourself via WhatsApp or copy:</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-[#1B202E] hover:bg-[#242A3D] text-slate-200 hover:text-white border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STANDALONE APK BUILDER */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
                    <Download className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      How to Generate a Standalone .APK File
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      If you need a physical `.apk` installer file for sideloading or Google Play Store:
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-blue-400">Option 1: WebAPK (Instant & Recommended)</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      When installed from Google Chrome via the <b>Android</b> tab, Android automatically creates a genuine APK file managed by Google Play Services. It behaves identically to a native APK with standalone full-screen view.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">Option 2: PWABuilder (Official Microsoft APK Generator)</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PWA Certified
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      1. Visit <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">PWABuilder.com</a><br />
                      2. Paste your live app URL: <span className="font-mono text-cyan-300 text-[10px] break-all">{bestUrl}</span><br />
                      3. PWABuilder validates the generated <b>192x192 &amp; 512x512 PNG icons</b>, <b>maskable icons</b>, and <b>Service Worker</b> automatically.<br />
                      4. Click <b>"Package for Android"</b> to download your ready-to-install `.apk`!
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">App Name: <b>{settings.shopName}</b></span>
                  <a
                    href={`https://www.pwabuilder.com?url=${encodeURIComponent(bestUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <span>Open PWABuilder APK Tool</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IPHONE / IOS */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Apple className="w-4 h-4 text-purple-400" />
                  <span>Installing on Apple iPhone / iPad (Safari)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[11px] font-bold flex items-center justify-center">1</span>
                    <p className="text-xs font-semibold text-white">Open in Safari</p>
                    <p className="text-[11px] text-slate-400">Open the app link in Safari on your iPhone or iPad.</p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800 space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[11px] font-bold flex items-center justify-center">2</span>
                    <p className="text-xs font-semibold text-white">Tap Share Button</p>
                    <p className="text-[11px] text-slate-400">Tap the Share icon (square with arrow pointing up) at the bottom toolbar.</p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-purple-800 text-[11px] font-bold flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 text-[11px] font-bold flex items-center justify-center">3</span>
                    <p className="text-xs font-semibold text-white">Add to Home Screen</p>
                    <p className="text-[11px] text-slate-400">Scroll down and tap <b>"Add to Home Screen"</b>, then tap <b>Add</b>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#131622] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Full offline storage & camera barcode scanner support</span>
          </div>
          <button
            onClick={() => setIsInstallModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
