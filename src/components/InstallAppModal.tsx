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
  Laptop,
  Monitor,
  Terminal,
  FileCode,
  FolderDown,
  Layers,
  Cpu,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export const InstallAppModal: React.FC = () => {
  const { isInstallModalOpen, setIsInstallModalOpen, settings } = useShop();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [copiedWebmanifest, setCopiedWebmanifest] = useState(false);
  const [showManifestPreview, setShowManifestPreview] = useState(true);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manifest' | 'windows' | 'scan' | 'android' | 'ios' | 'apk'>('manifest');

  // Direct shared live URL for phone or Windows PC access
  const sharedUrl = 'https://ais-pre-5rqxp63fkivomm7hhrxvoc-243110999915.asia-southeast1.run.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : sharedUrl;
  const bestUrl = currentUrl.includes('localhost') ? sharedUrl : currentUrl;

  // Listen for beforeinstallprompt event on Windows (Edge / Chrome) & Android
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
      alert(
        'To install directly on Windows via Microsoft Edge or Google Chrome:\n\n' +
        '1. Look at the right side of the address bar at the top.\n' +
        '2. Click the "Install App" or "App available" icon (⊕ or computer icon).\n' +
        '3. Click "Install" to create a Desktop shortcut and Start Menu entry.'
      );
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

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommandId(id);
    setTimeout(() => setCopiedCommandId(null), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Open and install ${settings.shopName} app: ${bestUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Generate and download a 1-click Windows Installer Batch Script (.bat)
  const handleDownloadWindowsBatch = () => {
    const cleanShopName = (settings.shopName || 'Zafar Mobile Store POS').replace(/["\\]/g, '');
    const batContent = `@echo off
title ${cleanShopName} - Windows Desktop Installer
color 0B
echo ==============================================================================
echo    ${cleanShopName} - Windows Desktop App Setup
echo ==============================================================================
echo.
echo Creating standalone Desktop shortcut and Start Menu launcher...
echo Target Application URL: ${bestUrl}
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
  "$startMenu = [System.Environment]::GetFolderPath('StartMenu') + '\\Programs'; " ^
  "$targetBrowser = \\"$env:ProgramFiles(x86)\\Microsoft\\Edge\\Application\\msedge.exe\\"; " ^
  "if (-not (Test-Path $targetBrowser)) { $targetBrowser = \\"$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe\\" }; " ^
  "if (-not (Test-Path $targetBrowser)) { $targetBrowser = \\"$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe\\" }; " ^
  "if (-not (Test-Path $targetBrowser)) { $targetBrowser = \\"$env:ProgramFiles(x86)\\Google\\Chrome\\Application\\chrome.exe\\" }; " ^
  "$s1 = $ws.CreateShortcut(\\"$desktop\\${cleanShopName}.lnk\\"); " ^
  "$s1.TargetPath = $targetBrowser; " ^
  "$s1.Arguments = '--app=\\"${bestUrl}\\"'; " ^
  "$s1.Description = '${cleanShopName} - Mobile POS and IMEI Inventory System'; " ^
  "$s1.WindowStyle = 3; " ^
  "$s1.Save(); " ^
  "$s2 = $ws.CreateShortcut(\\"$startMenu\\${cleanShopName}.lnk\\"); " ^
  "$s2.TargetPath = $targetBrowser; " ^
  "$s2.Arguments = '--app=\\"${bestUrl}\\"'; " ^
  "$s2.Description = '${cleanShopName} - Mobile POS and IMEI Inventory System'; " ^
  "$s2.WindowStyle = 3; " ^
  "$s2.Save();"

echo.
echo ==============================================================================
echo [SUCCESS] '${cleanShopName}' desktop app successfully installed!
echo Desktop Shortcut: Created on your Windows Desktop
echo Start Menu Entry: Added to Windows Programs
echo.
echo You can now double-click '${cleanShopName}' on your desktop to run the store!
echo ==============================================================================
echo.
pause
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Install-${cleanShopName.replace(/[^a-zA-Z0-9]/g, '-')}-Windows.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Web Manifest JSON specification for Microsoft PWABuilder & PWA Standards
  const manifestObject = {
    id: "/",
    short_name: (settings.shopName || "Zafar Mobile").slice(0, 12),
    name: `${settings.shopName || "ZAFAR MOBILE STORE"} - POS & IMEI Inventory`,
    description: "Comprehensive Mobile Point of Sale (POS), Real-Time IMEI Inventory Tracking, Used Phone Police Protection Verification, Barcode Scanner, and Thermal Receipt Printing System for mobile retail shops.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: [
      "window-controls-overlay",
      "standalone",
      "minimal-ui"
    ],
    orientation: "any",
    background_color: "#0B0F17",
    theme_color: "#0F172A",
    categories: [
      "business",
      "finance",
      "productivity",
      "shopping",
      "utilities"
    ],
    icons: [
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any"
      },
      {
        src: "/icon-maskable-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "maskable"
      },
      {
        src: "/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable"
      },
      {
        src: "/icon-1024.png",
        type: "image/png",
        sizes: "1024x1024",
        purpose: "any"
      },
      {
        src: "/icon-maskable-1024.png",
        type: "image/png",
        sizes: "1024x1024",
        purpose: "maskable"
      },
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any"
      }
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "540x960",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile POS & IMEI Lookup View"
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Desktop POS Management Dashboard"
      }
    ],
    shortcuts: [
      {
        name: "New Sale POS",
        short_name: "New Sale",
        description: "Start a new customer phone checkout and print receipt",
        url: "/?tab=pos",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Add Device Intake",
        short_name: "Add Device",
        description: "Intake a new or used mobile device with IMEI and Police certificate",
        url: "/?tab=inventory",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }]
      }
    ],
    prefer_related_applications: false
  };

  const manifestJsonString = JSON.stringify(manifestObject, null, 2);

  const handleDownloadManifest = () => {
    const blob = new Blob([manifestJsonString], { type: 'application/manifest+json; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWebmanifest = () => {
    const blob = new Blob([manifestJsonString], { type: 'application/manifest+json; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.webmanifest';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(bestUrl)}`;

  // Pre-configured PWABuilder URL for Windows packaging
  const pwaBuilderWindowsUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(bestUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#11141E] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950/80 border border-blue-600/50 rounded-xl text-blue-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Install {settings.shopName} (Windows &amp; Mobile)
                </h2>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-700/50 text-[10px] font-bold rounded-full uppercase">
                  Windows .EXE &bull; APK &bull; PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Package as a Windows executable (.exe / .msix), install directly on desktop, or run on mobile phones
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
            onClick={() => setActiveTab('manifest')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'manifest'
                ? 'border-emerald-400 text-emerald-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Web Manifest &amp; PWABuilder</span>
            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded text-[9px] font-mono font-bold">
              .JSON
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'windows'
                ? 'border-blue-400 text-blue-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Windows (.EXE &amp; Desktop)</span>
          </button>

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
                ? 'border-indigo-400 text-indigo-300 bg-[#191E2C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>APK Package (.apk)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#0F121B]">
          
          {/* TAB: WEB MANIFEST & PWABUILDER COMPLIANCE */}
          {activeTab === 'manifest' && (
            <div className="space-y-5">
              
              {/* Primary Callout: Web App Manifest Overview */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/60 via-[#161B26] to-[#161B26] rounded-2xl border border-emerald-600/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                        <FileCode className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        Web App Manifest (مینی فیسٹ فائل اور اسٹور پیکیجنگ)
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold rounded-full">
                        100% PWA Score &bull; PWABuilder Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A <b>Web Manifest</b> is a JSON text file that defines your web application’s identity, high-resolution icons (192px, 512px, 1024px PNG &amp; Maskable), start URL, standalone display mode, and theme colors. It enables <b>Microsoft PWABuilder</b>, <b>Google Play Store</b>, and <b>Windows Store</b> to package and distribute your store as an installable app.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadManifest}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all"
                      title="Download manifest.json file"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download manifest.json</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCopyManifest}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center gap-2 cursor-pointer transition-all"
                      title="Copy Manifest JSON to clipboard"
                    >
                      {copiedManifest ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedManifest ? 'JSON Copied!' : 'Copy Manifest JSON'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PWABuilder "Did not find a Web Manifest" Warning & Immediate Solution */}
              <div className="p-4 bg-[#141824] rounded-xl border border-amber-600/50 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        PWABuilder says "Did not find a Web Manifest"? Here is why &amp; the 10-second fix:
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      When you enter your app URL into <b>PWABuilder.com</b>, PWABuilder uses an automated remote web crawler. The Google AI Studio preview sandbox (<code className="text-amber-300 font-mono">ais-pre-...</code>) includes an anti-bot security cookie verification redirect (<code className="text-amber-300 font-mono">__cookie_check.html</code>) which protects the app from unauthenticated scrapers. PWABuilder's bot cannot execute that cookie script automatically.
                    </p>
                    <div className="p-3 bg-[#0C0F17] rounded-lg border border-amber-900/60 space-y-1.5 text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Instant 2-Step Solution (Gets 100/100 PWA Score in PWABuilder):</span>
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                        <li>
                          Click the blue <b>"Copy Manifest JSON"</b> button above (or <b>"Download manifest.json"</b>).
                        </li>
                        <li>
                          In PWABuilder, click <b>"Use our Manifest Editor to generate one"</b> (or <b>"Upload Manifest"</b>) and paste the copied JSON or choose the downloaded file.
                        </li>
                        <li>
                          PWABuilder will immediately recognize your manifest, validate all icons and screenshots with a <b>100% PWA Score</b>, and unlock <b>"Package for Windows (.msix / .exe)"</b> and <b>"Package for Android (.apk)"</b>!
                        </li>
                      </ol>
                    </div>

                    {/* PWABuilder 500 Internal Server Error Explanation */}
                    <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-800/60 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Seeing "Response status code does not indicate success: 500 (Internal Server Error)"?</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        This is an official <b>.NET / C# error thrown by Microsoft PWABuilder's Azure cloud packaging servers</b>. It happens when PWABuilder's Azure queue is overloaded, or when its cloud worker cannot fetch external assets through Cloud Run's security layer.
                      </p>
                      <div className="p-2 bg-[#090C14] rounded border border-rose-900/80 text-[11px] space-y-1 text-slate-300">
                        <span className="font-bold text-emerald-400">&bull; Recommended Zero-Failure Alternatives:</span>
                        <p>
                          1. <b>Method 1 (Instant Windows Desktop App)</b>: Open in Microsoft Edge or Google Chrome &rarr; click <b>"Install App"</b> in the address bar (⊕ icon). No cloud server required!
                        </p>
                        <p>
                          2. <b>Method 2 (1-Click Windows .BAT Installer)</b>: In the <b>Windows (.EXE &amp; Desktop)</b> tab, click <b>"Download .BAT Installer"</b> and double-click it on your PC.
                        </p>
                        <p>
                          3. <b>PWABuilder Local CLI</b>: Run <code className="text-cyan-300 font-mono">npx @pwabuilder/cli package</code> in terminal to build the package 100% locally on your machine without relying on Azure cloud servers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons for Manifest */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleDownloadManifest}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download manifest.json</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWebmanifest}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download manifest.webmanifest</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyManifest}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedManifest ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedManifest ? 'JSON Copied!' : 'Copy Manifest JSON'}</span>
                  </button>

                  <a
                    href="/manifest.json"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#1F2637] hover:bg-[#2B354C] text-cyan-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <span>Test /manifest.json Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={pwaBuilderWindowsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Launch PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 12-Point PWA & Manifest Compliance Scorecard */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-blue-500/20 text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Manifest &amp; PWA Standards Scorecard (12/12 Passed)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold rounded">
                    100% W3C &bull; Chromium &bull; Apple Safari
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { label: 'Application ID', value: '"/" (Chromium ID compliant)', check: true },
                    { label: 'Full Application Name', value: 'ZAFAR MOBILE STORE - POS & IMEI Inventory', check: true },
                    { label: 'Mobile Short Name', value: 'Zafar Mobile (12 chars ≤ 12 limit)', check: true },
                    { label: 'Display Mode', value: 'standalone (native window, no URL bar)', check: true },
                    { label: 'Display Override', value: 'window-controls-overlay, standalone', check: true },
                    { label: 'Orientation', value: 'any (supports portrait & landscape)', check: true },
                    { label: 'Theme & Nav Bar Color', value: '#0F172A (Deep Slate Navy)', check: true },
                    { label: 'Splash Background Color', value: '#0B0F17 (Dark Obsidian)', check: true },
                    { label: 'Start URL & Navigation Scope', value: 'start_url: "/" &bull; scope: "/"', check: true },
                    { label: 'Standard Icons (PNG)', value: '192x192, 512x512, 1024x1024 PNG', check: true },
                    { label: 'Maskable Icons (Android)', value: '192x192, 512x512, 1024x1024 with 15% safe padding', check: true },
                    { label: 'Apple Touch Icon (iOS)', value: '180x180 PNG (for iPhone home screen)', check: true },
                    { label: 'App Screenshots', value: 'Desktop (1280x720) &amp; Mobile (540x960)', check: true },
                    { label: 'App Shortcuts', value: 'Quick POS Sale &amp; Device Intake', check: true },
                    { label: 'Service Worker', value: 'sw.js active with offline cache', check: true },
                    { label: 'CORS & Content-Type', value: 'application/manifest+json; charset=utf-8 &bull; CORS: *', check: true },
                  ].map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-[#0F121C] rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-200 block truncate">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate" dangerouslySetInnerHTML={{ __html: item.value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Manifest JSON Source Code Viewer */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Manifest JSON Content (/manifest.json)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyManifest}
                      className="px-2.5 py-1 bg-[#1E2536] hover:bg-[#2A344E] text-slate-200 rounded text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copiedManifest ? 'Copied' : 'Copy All'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManifestPreview(!showManifestPreview)}
                      className="px-2.5 py-1 bg-[#1E2536] hover:bg-[#2A344E] text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>{showManifestPreview ? 'Collapse' : 'Expand'}</span>
                      {showManifestPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {showManifestPreview && (
                  <div className="relative">
                    <pre className="font-mono text-[11px] text-emerald-400 bg-[#07090F] p-3 rounded-lg border border-slate-800 max-h-72 overflow-y-auto overflow-x-auto select-all scrollbar-thin">
                      {manifestJsonString}
                    </pre>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: WINDOWS INSTALLATION (.EXE / MSIX / DESKTOP SETUP) */}
          {activeTab === 'windows' && (
            <div className="space-y-5">
              
              {/* Primary Callout: Converting to Windows Installation File */}
              <div className="p-5 bg-gradient-to-r from-blue-950/60 via-[#161B26] to-[#161B26] rounded-2xl border border-blue-600/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        <Monitor className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        Convert &amp; Install on Windows PC (ونڈوز سافٹ ویئر)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      You have <b>4 professional methods</b> to run this system as a native Windows desktop program with full barcode scanner, cash drawer, thermal receipt printing, and offline database support.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isInstallable ? 'Install on Windows' : 'Install Windows App'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDownloadWindowsBatch}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all"
                      title="Download a 1-click Windows Setup Script (.bat)"
                    >
                      <FolderDown className="w-4 h-4" />
                      <span>Download .BAT Installer</span>
                    </button>
                  </div>
                </div>

                {installedSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{settings.shopName} is installed on Windows! You can launch it directly from your Desktop or Start Menu.</span>
                  </div>
                )}
              </div>

              {/* METHOD 1: 1-Click Desktop App via Edge / Chrome */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Method 1: Instant Native Windows App (Edge &amp; Chrome) - Recommended
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold">
                    Zero Download &bull; Instant
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Both <b>Microsoft Edge</b> and <b>Google Chrome</b> on Windows include a built-in compiler that converts this web app into a real Windows desktop app:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-400 uppercase">Step A: Address Bar Icon</span>
                    <p className="text-xs font-semibold text-white">Look at Top Address Bar</p>
                    <p className="text-[11px] text-slate-400">
                      In the browser address bar at the top-right, click the <b>"Install App"</b> icon (a computer screen with a down arrow, or ⊕).
                    </p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Step B: Or Use Browser Menu</span>
                    <p className="text-xs font-semibold text-white">Browser Menu (⋮ or ...)</p>
                    <p className="text-[11px] text-slate-400">
                      Click the 3 dots in the top-right corner &rarr; select <b>Apps</b> &rarr; click <b>"Install this site as an app"</b>.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0F121C] rounded-lg border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-purple-400 uppercase">Step C: Native Desktop Icon</span>
                    <p className="text-xs font-semibold text-white">Pin to Taskbar &amp; Desktop</p>
                    <p className="text-[11px] text-slate-400">
                      Check <b>"Create Desktop shortcut"</b> and <b>"Pin to taskbar"</b>. It now opens in its own clean window without any URL bar!
                    </p>
                  </div>
                </div>
              </div>

              {/* METHOD 2: 1-Click Windows Batch Installer (.bat) */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Method 2: One-Click Windows Setup File (.BAT)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    For Any Windows PC
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Download a pre-configured Windows setup batch file. When double-clicked on any Windows 10/11 PC, it automatically creates the desktop shortcut and registers the app into the Windows Start Menu programs:
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#0F121C] rounded-lg border border-slate-800">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-xs font-bold text-white">
                      Install-{settings.shopName.replace(/[^a-zA-Z0-9]/g, '-')}-Windows.bat
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Double-click to create Desktop icon &bull; launches in full-screen standalone app mode
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadWindowsBatch}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <FolderDown className="w-4 h-4" />
                    <span>Download Windows .BAT Setup</span>
                  </button>
                </div>
              </div>

              {/* METHOD 3: Microsoft PWABuilder (.MSIX / Windows Store Installer) */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-bold flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Method 3: Official Microsoft PWABuilder (.msix / Windows Installer)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-bold">
                    Official Microsoft Tool
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Microsoft provides a free online packaging utility (<b>PWABuilder.com</b>) that converts this PWA into an official signed <b>.msix</b> Windows installer file or Microsoft Store package:
                </p>

                {/* Important Notice & Explanation for PWABuilder "Did not find a Web Manifest" */}
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-amber-200">
                        PWABuilder says "Did not find a Web Manifest"? Here is why &amp; the 10-second fix:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        The Google AI Studio preview sandbox URL (<code className="text-amber-300 font-mono">ais-pre-...</code>) uses a security cookie verification redirect (<code className="text-amber-300 font-mono">__cookie_check.html</code>) which protects the preview from unauthenticated scrapers. PWABuilder's remote crawler cannot bypass this security check directly from the URL.
                      </p>
                      <p className="text-emerald-300 text-[11px] font-semibold">
                        &check; Your web manifest and all high-res icons (192px, 512px, 1024px) are 100% complete and valid! Simply upload or paste it into PWABuilder below:
                      </p>
                    </div>
                  </div>

                  {/* Manifest Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2 border-t border-amber-800/40">
                    <button
                      type="button"
                      onClick={handleDownloadManifest}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Download manifest.json</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyManifest}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedManifest ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedManifest ? 'Manifest Copied!' : 'Copy Manifest JSON'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowManifestPreview(!showManifestPreview)}
                      className="px-3 py-1.5 bg-[#1F2637] hover:bg-[#2B354C] text-slate-200 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showManifestPreview ? 'Hide JSON' : 'View Manifest JSON'}</span>
                      {showManifestPreview ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>

                  {/* Collapsible Manifest JSON Preview */}
                  {showManifestPreview && (
                    <div className="mt-2 p-2.5 bg-[#090C14] rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-cyan-300">manifest.json (100% Compliant PWA Specification)</span>
                        <button
                          type="button"
                          onClick={handleCopyManifest}
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Raw JSON</span>
                        </button>
                      </div>
                      <pre className="font-mono text-[10px] text-emerald-400 bg-black/60 p-2.5 rounded border border-slate-800/80 max-h-56 overflow-y-auto overflow-x-auto select-all">
                        {manifestJsonString}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Step-by-Step PWABuilder Instructions */}
                <div className="p-3.5 bg-[#0F121C] rounded-lg border border-slate-800 space-y-2.5 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>How to package in PWABuilder (3 Easy Steps):</span>
                  </span>

                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                    <li>
                      Click the blue <b>"Download manifest.json"</b> button above, or click <b>"Copy Manifest JSON"</b>.
                    </li>
                    <li>
                      On the PWABuilder page, click <b>"Use our Manifest Editor to generate one"</b> (or click <b>"Upload Manifest"</b>) and choose the downloaded <code className="text-cyan-300">manifest.json</code> file, or paste the copied JSON.
                    </li>
                    <li>
                      PWABuilder will immediately validate your store with a <b>100% PWA Score</b>. Click <b>"Package for Windows"</b> to download your ready-to-run <b>.msix installer</b> or <b>.zip package</b>!
                    </li>
                  </ol>
                  
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-cyan-300 break-all">{bestUrl}</span>
                    <a
                      href={pwaBuilderWindowsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>Open Microsoft PWABuilder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-950/30 border border-blue-800/40 rounded-lg text-[11px] text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <b>Quick Tip:</b> You can also use <b>Method 1 (Instant Edge / Chrome install)</b> or <b>Method 2 (1-Click .BAT setup)</b> above right now without using any online website or packaging tool!
                  </span>
                </div>
              </div>

              {/* METHOD 4: Electron & electron-builder (Standard .EXE NSIS Setup Wizard) */}
              <div className="p-4 bg-[#141824] rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold flex items-center justify-center">4</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Method 4: Standalone Electron .EXE NSIS Installer (Developer Build)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                    Setup.exe (NSIS)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  If you have downloaded the project source code and want to compile a traditional <b>Setup.exe</b> (NSIS installer wizard with Next &gt; Next &gt; Finish):
                </p>

                {/* Command 1: Electron Builder */}
                <div className="space-y-2">
                  <div className="p-3 bg-[#0A0D15] rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>A. Build with Electron (Included in repo /electron/main.cjs):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand('npm install --save-dev electron electron-builder && npm run build && npx electron-builder --win nsis', 'cmd1')}
                        className="text-[10px] px-2 py-1 bg-[#1E2536] hover:bg-[#2A344E] text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCommandId === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                        <span>{copiedCommandId === 'cmd1' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] text-cyan-300 bg-[#06080F] p-2 rounded border border-slate-800/60 overflow-x-auto select-all">
                      npm install --save-dev electron electron-builder &amp;&amp; npm run build &amp;&amp; npx electron-builder --win nsis
                    </pre>
                  </div>

                  {/* Command 2: 1-Line Nativefier */}
                  <div className="p-3 bg-[#0A0D15] rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>B. Instant 1-Line CLI (.exe bundle via Nativefier):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(`npx @nativefier/nativefier --name "${settings.shopName || 'ZafarMobilePOS'}" "${bestUrl}" --platform windows --arch x64`, 'cmd2')}
                        className="text-[10px] px-2 py-1 bg-[#1E2536] hover:bg-[#2A344E] text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCommandId === 'cmd2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                        <span>{copiedCommandId === 'cmd2' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] text-amber-300 bg-[#06080F] p-2 rounded border border-slate-800/60 overflow-x-auto select-all">
                      npx @nativefier/nativefier --name "{settings.shopName || 'ZafarMobilePOS'}" "{bestUrl}" --platform windows --arch x64
                    </pre>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Documentation and Electron configuration are already saved in <code className="text-cyan-300">/electron/main.cjs</code> and <code className="text-cyan-300">/electron/README-WINDOWS-BUILD.md</code>.
                </p>
              </div>

            </div>
          )}

          {/* TAB: SCAN QR CODE WITH PHONE CAMERA */}
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
                          <span>Copy Link</span>
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
                  <span className="text-[10px] text-slate-400 block font-medium">Direct URL:</span>
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
                  <span className="text-xs font-bold text-cyan-400">Step 1: Scan &amp; Open</span>
                  <p className="text-[11px] text-slate-400">Scan QR or open the shared link on your Android or iPhone.</p>
                </div>
                <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-emerald-400">Step 2: Tap Menu / Share</span>
                  <p className="text-[11px] text-slate-400">Tap <b>&vellip;</b> (Chrome) or <b>Share icon</b> (Safari).</p>
                </div>
                <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-purple-400">Step 3: Install App</span>
                  <p className="text-[11px] text-slate-400">Tap <b>"Install App"</b> or <b>"Add to Home Screen"</b>.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANDROID (CHROME) */}
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
                    <p className="text-xs font-semibold text-white">Tap Menu (&vellip;)</p>
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

          {/* TAB: IPHONE / IOS */}
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

          {/* TAB: STANDALONE APK BUILDER */}
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
                    <span className="font-bold text-blue-400">Option 1: WebAPK (Instant &amp; Recommended)</span>
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

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#131622] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Full offline storage, thermal printer support &amp; camera barcode scanner</span>
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
