import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Upload, 
  Flashlight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Barcode, 
  Sparkles,
  RefreshCw,
  SwitchCamera,
  Layers,
  ClipboardPaste,
  Smartphone
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
}

interface DetectedBarcodeCandidate {
  rawValue: string;
  cleanedValue: string;
  type: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan IMEI Barcode / QR Code',
  subtitle = 'Point camera at the barcode on the phone box, back sticker, or dial *#06# on screen'
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  
  // Hardware capabilities
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(3);
  const [minZoom, setMinZoom] = useState<number>(1);

  // Manual input fallback
  const [manualInput, setManualInput] = useState('');
  const [detectedCandidates, setDetectedCandidates] = useState<DetectedBarcodeCandidate[]>([]);
  const [fileScanning, setFileScanning] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasProcessedScanRef = useRef<boolean>(false);

  const containerId = 'html5-qrcode-scanner-region';

  // Check if native BarcodeDetector is available
  const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Sound & Vibration Feedback
  const triggerSuccessFeedback = useCallback(() => {
    // 1. Audio chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Audio context may be restricted by browser policy
    }

    // 2. Haptic vibration
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }
    } catch {
      // Ignore vibration error
    }
  }, []);

  // Parse and extract pure IMEI or serial number
  const cleanImei = useCallback((raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // 1. Look for standard 15-digit IMEI (or 14-16 digits)
    const imei15Match = trimmed.match(/\b\d{15}\b/);
    if (imei15Match) return imei15Match[0];

    const digitMatch = trimmed.match(/\b\d{14,17}\b/);
    if (digitMatch) return digitMatch[0];

    // 2. Look for IMEI: 3587... or IMEI 1: 3587...
    const labelMatch = trimmed.match(/(?:IMEI|IMEI1|IMEI2|MEID)\s*[:=-]?\s*([0-9A-Za-z]+)/i);
    if (labelMatch && labelMatch[1]) {
      return labelMatch[1];
    }

    // 3. Look for Serial Number: S/N: G6T...
    const snMatch = trimmed.match(/(?:SN|S\/N|SERIAL|SER)\s*[:=-]?\s*([0-9A-Za-z]+)/i);
    if (snMatch && snMatch[1]) {
      return snMatch[1];
    }

    return trimmed;
  }, []);

  // Find all candidate identifiers in text (e.g. dual IMEI barcodes)
  const extractAllCandidates = useCallback((text: string): DetectedBarcodeCandidate[] => {
    const results: DetectedBarcodeCandidate[] = [];
    const seen = new Set<string>();

    // 15-digit numbers
    const all15s = text.match(/\b\d{15}\b/g) || [];
    all15s.forEach((num, idx) => {
      if (!seen.has(num)) {
        seen.add(num);
        results.push({
          rawValue: num,
          cleanedValue: num,
          type: `IMEI ${idx + 1}`
        });
      }
    });

    // Other 14-17 digits
    const otherDigits = text.match(/\b\d{14,17}\b/g) || [];
    otherDigits.forEach((num) => {
      if (!seen.has(num)) {
        seen.add(num);
        results.push({
          rawValue: num,
          cleanedValue: num,
          type: 'Numeric Code'
        });
      }
    });

    return results;
  }, []);

  // Stop all camera streams and scanners
  const stopLiveStreams = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error(e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        html5QrCodeRef.current.clear();
      } catch {
        // Safe ignore
      }
      html5QrCodeRef.current = null;
    }

    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Final submit handler
  const handleFinalScan = useCallback((value: string) => {
    if (!value || hasProcessedScanRef.current) return;
    hasProcessedScanRef.current = true;

    const cleaned = cleanImei(value);
    triggerSuccessFeedback();
    setScannedResult(cleaned);

    // Stop streams
    stopLiveStreams();

    setTimeout(() => {
      onScanSuccess(cleaned);
      onClose();
    }, 400);
  }, [cleanImei, onClose, onScanSuccess, stopLiveStreams, triggerSuccessFeedback]);

  // Fallback Html5Qrcode software scanner
  const startHtml5QrcodeFallback = useCallback(async () => {
    try {
      stopLiveStreams();

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.AZTEC,
        ],
        verbose: false
      });
      html5QrCodeRef.current = html5QrCode;

      const availableCams = await Html5Qrcode.getCameras();
      if (availableCams && availableCams.length > 0) {
        setCameras(availableCams);
        const camId = availableCams[selectedCameraIndex]?.id || availableCams[0].id;

        await html5QrCode.start(
          camId,
          {
            fps: 20,
            qrbox: (w, h) => {
              const minSize = Math.min(w, h);
              return { width: Math.floor(minSize * 0.9), height: Math.floor(minSize * 0.55) };
            },
            aspectRatio: 1.333
          },
          (decodedText) => {
            handleFinalScan(decodedText);
          },
          () => {}
        );
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Html5Qrcode fallback error:', err);
      setErrorMessage(err.message || 'Unable to start camera. Please verify camera permissions.');
    }
  }, [handleFinalScan, selectedCameraIndex, stopLiveStreams]);

  // Native Barcode Detector Loop (60 FPS hardware accelerated)
  const startNativeBarcodeScanner = useCallback(async (_stream: MediaStream) => {
    if (!hasNativeBarcodeDetector || !videoRef.current) return;

    try {
      const formats = [
        'code_128',
        'code_39',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'qr_code',
        'data_matrix',
        'itf',
        'codabar',
        'aztec',
        'pdf417'
      ];
      
      const barcodeDetector = new (window as any).BarcodeDetector({ formats });

      const scanFrame = async () => {
        if (!isComponentMounted.current || hasProcessedScanRef.current || !videoRef.current) return;

        if (videoRef.current.readyState >= 2) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected) {
                if (barcodes.length > 1) {
                  const candidates: DetectedBarcodeCandidate[] = barcodes.map((b: any, idx: number) => ({
                    rawValue: b.rawValue,
                    cleanedValue: cleanImei(b.rawValue),
                    type: b.format ? b.format.toUpperCase() : `Barcode ${idx + 1}`
                  }));
                  setDetectedCandidates(candidates);
                }

                handleFinalScan(detected);
                return;
              }
            }
          } catch {
            // Frame detection error, continue next frame
          }
        }

        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      };

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      console.warn('Native BarcodeDetector initialization fallback to Html5Qrcode', err);
      startHtml5QrcodeFallback();
    }
  }, [cleanImei, handleFinalScan, hasNativeBarcodeDetector, startHtml5QrcodeFallback]);

  // Start live camera stream
  const startLiveCamera = useCallback(async () => {
    setErrorMessage(null);
    setScannedResult(null);
    setDetectedCandidates([]);
    hasProcessedScanRef.current = false;

    try {
      // 1. Enumerate video devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({
            id: d.deviceId,
            label: d.label || `Camera ${index + 1}`
          }));
        setCameras(videoDevices);
      }

      // 2. High performance direct getUserMedia
      const videoConstraints: any = {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        focusMode: 'continuous'
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      // 3. Inspect video track capabilities (Zoom, Torch)
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorch(true);
          }
          if (capabilities.zoom) {
            setZoomSupported(true);
            setMinZoom(capabilities.zoom.min || 1);
            setMaxZoom(capabilities.zoom.max || 3);
            setZoomLevel(capabilities.zoom.min || 1);
          }
        } catch {
          // Track capabilities not accessible
        }
      }

      // 4. If native BarcodeDetector is available, use fast 60fps loop
      if (hasNativeBarcodeDetector) {
        startNativeBarcodeScanner(stream);
      } else {
        startHtml5QrcodeFallback();
      }

    } catch (err: any) {
      console.warn('Direct getUserMedia failed, attempting Html5Qrcode fallback:', err);
      startHtml5QrcodeFallback();
    }
  }, [hasNativeBarcodeDetector, startHtml5QrcodeFallback, startNativeBarcodeScanner]);

  // Flip Camera (Next available lens)
  const flipCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (selectedCameraIndex + 1) % cameras.length;
    setSelectedCameraIndex(nextIdx);
    stopLiveStreams();

    try {
      const nextCamId = cameras[nextIdx]?.id;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: nextCamId ? { deviceId: { exact: nextCamId } } : { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      if (hasNativeBarcodeDetector) {
        startNativeBarcodeScanner(stream);
      } else {
        startHtml5QrcodeFallback();
      }
    } catch {
      startLiveCamera();
    }
  }, [cameras, hasNativeBarcodeDetector, selectedCameraIndex, startHtml5QrcodeFallback, startLiveCamera, startNativeBarcodeScanner, stopLiveStreams]);

  // Hardware Torch toggle
  const toggleTorch = useCallback(async () => {
    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const nextState = !torchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }]
          });
          setTorchOn(nextState);
        } catch (e) {
          console.error('Torch toggle error:', e);
        }
      }
    }
  }, [hasTorch, torchOn]);

  // Hardware Zoom adjustment
  const handleZoom = useCallback(async (targetZoom: number) => {
    if (streamRef.current && zoomSupported) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const clamped = Math.min(Math.max(targetZoom, minZoom), maxZoom);
          await (track as any).applyConstraints({
            advanced: [{ zoom: clamped }]
          });
          setZoomLevel(clamped);
        } catch (e) {
          console.error('Zoom error:', e);
        }
      }
    }
  }, [maxZoom, minZoom, zoomSupported]);

  // Image Upload File Scanner
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setErrorMessage(null);

    try {
      // 1. Try native BarcodeDetector on ImageBitmap if available
      if (hasNativeBarcodeDetector && typeof createImageBitmap !== 'undefined') {
        const imageBitmap = await createImageBitmap(file);
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'qr_code', 'data_matrix', 'itf']
        });
        const detected = await barcodeDetector.detect(imageBitmap);
        if (detected && detected.length > 0) {
          const mainResult = detected[0].rawValue;
          if (detected.length > 1) {
            const candidates: DetectedBarcodeCandidate[] = detected.map((b: any, idx: number) => ({
              rawValue: b.rawValue,
              cleanedValue: cleanImei(b.rawValue),
              type: b.format ? b.format.toUpperCase() : `Barcode ${idx + 1}`
            }));
            setDetectedCandidates(candidates);
          }
          handleFinalScan(mainResult);
          setFileScanning(false);
          return;
        }
      }

      // 2. Fallback to Html5Qrcode file scan
      const html5QrCode = new Html5Qrcode('file-scanner-temp', { verbose: false });
      const decodedResult = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      const candidates = extractAllCandidates(decodedResult);
      if (candidates.length > 1) {
        setDetectedCandidates(candidates);
      }

      handleFinalScan(decodedResult);
    } catch (err: any) {
      console.error('File scan error:', err);
      setErrorMessage(
        'Could not detect a barcode or QR code in this image. Please ensure the IMEI barcode is well lit, in focus, or enter the 15-digit number manually.'
      );
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [cleanImei, extractAllCandidates, handleFinalScan, hasNativeBarcodeDetector]);

  // Handle Clipboard Paste
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = cleanImei(text);
        setManualInput(cleaned);
      }
    } catch {
      alert('Please paste using Ctrl+V or Long-press');
    }
  }, [cleanImei]);

  // Start/Stop scanner on open/close
  useEffect(() => {
    isComponentMounted.current = true;
    hasProcessedScanRef.current = false;

    if (isOpen) {
      if (activeTab === 'camera') {
        const timer = setTimeout(() => {
          startLiveCamera();
        }, 100);
        return () => {
          clearTimeout(timer);
          stopLiveStreams();
        };
      }
    } else {
      stopLiveStreams();
    }

    return () => {
      isComponentMounted.current = false;
      stopLiveStreams();
    };
  }, [isOpen, activeTab, startLiveCamera, stopLiveStreams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#11141E] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-700/80 flex flex-col text-slate-200">
        
        {/* Modal Header */}
        <div className="bg-[#151924] px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-900/50">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">{title}</h3>
                {hasNativeBarcodeDetector && (
                  <span className="hidden sm:inline px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[9px] font-bold rounded uppercase">
                    HW Accelerated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">High-Precision IMEI, Code-128 & QR Reader</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopLiveStreams();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Live Camera vs Photo Upload vs Manual Keypad */}
        <div className="px-5 pt-2.5 pb-2 bg-[#0E1119] border-b border-slate-800 flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopLiveStreams();
                setActiveTab('upload');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Photo / File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopLiveStreams();
                setActiveTab('manual');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Keypad / Paste</span>
            </button>
          </div>

          {/* Flip camera / camera selector */}
          {activeTab === 'camera' && cameras.length > 1 && (
            <button
              type="button"
              onClick={flipCamera}
              className="p-1.5 bg-[#1A1F2C] hover:bg-[#252D3F] border border-slate-700/80 text-cyan-400 hover:text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Switch Camera Lens"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Flip Cam</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-[#0F121C]">
          
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle}
          </p>

          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-4/3 flex items-center justify-center shadow-inner">
              
              {/* Native Video Stream Viewport */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Fallback Html5Qrcode container (if native detector not present) */}
              {!hasNativeBarcodeDetector && (
                <div id={containerId} className="w-full h-full absolute inset-0" />
              )}

              {/* High-Precision Viewfinder Overlay */}
              {isScanning && !scannedResult && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  
                  {/* Outer reticle box */}
                  <div className="relative w-full max-w-[290px] h-[130px] sm:h-[140px] border-2 border-dashed border-emerald-400/90 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center">
                    
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-emerald-300 rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-emerald-300 rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-emerald-300 rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-emerald-300 rounded-br-sm" />
                    
                    {/* Animated Scanning Laser */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#34d399] animate-pulse" />

                    <span className="absolute -bottom-6 text-[10px] font-mono font-bold text-emerald-300 bg-black/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full tracking-wider">
                      ALIGN BARCODE IN BOX
                    </span>
                  </div>

                </div>
              )}

              {/* Camera Controls Overlay (Flashlight & Zoom) */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                
                {/* Zoom Controls */}
                {zoomSupported && isScanning ? (
                  <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => handleZoom(1)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        zoomLevel <= 1 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom(2)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        zoomLevel > 1.5 && zoomLevel < 2.5 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2x
                    </button>
                    {maxZoom >= 3 && (
                      <button
                        type="button"
                        onClick={() => handleZoom(3)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                          zoomLevel >= 2.8 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        3x
                      </button>
                    )}
                  </div>
                ) : <div />}

                {/* Torch Button */}
                {hasTorch && isScanning && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-xl backdrop-blur-md shadow-lg border transition-all cursor-pointer ${
                      torchOn 
                        ? 'bg-amber-400 text-black border-amber-300 font-bold' 
                        : 'bg-black/75 text-slate-200 hover:text-white border-slate-700'
                    }`}
                    title="Toggle Flashlight"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Camera Starting Spinner */}
              {!isScanning && !errorMessage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0B0D14]/90 p-4 text-center">
                  <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-semibold">Opening high-speed camera stream...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PHOTO */}
          {activeTab === 'upload' && (
            <div className="rounded-2xl border-2 border-dashed border-slate-700/80 bg-[#161A26] p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-700/60 flex items-center justify-center mx-auto text-blue-400 shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">Upload Photo of IMEI Label or Screen</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Take a photo or upload screenshot of phone box sticker, back cover, or *#06# dialer screen
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                id="barcode-photo-upload-input"
              />

              <label
                htmlFor="barcode-photo-upload-input"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 cursor-pointer transition-all"
              >
                {fileScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image Barcodes...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Select Photo / Take Picture</span>
                  </>
                )}
              </label>

              <div id="file-scanner-temp" className="hidden" />
            </div>
          )}

          {/* TAB 3: MANUAL KEYPAD / PASTE INPUT */}
          {activeTab === 'manual' && (
            <div className="p-4 bg-[#141824] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">Enter or Paste 15-Digit IMEI</label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste from Clipboard</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. 358742091234567"
                  className="flex-1 bg-[#0F121C] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider placeholder:text-slate-600 focus:border-blue-500 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={!manualInput.trim()}
                  onClick={() => handleFinalScan(manualInput)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Apply
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Type the 15-digit number printed on the mobile sim tray or phone box.
              </p>
            </div>
          )}

          {/* Multiple Barcodes / Dual IMEI Detected Candidates */}
          {detectedCandidates.length > 0 && (
            <div className="p-3 bg-blue-950/50 border border-blue-700/50 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Multiple Barcodes Found - Select Target:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detectedCandidates.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFinalScan(cand.cleanedValue)}
                    className="p-2 bg-[#141826] hover:bg-[#1C2234] border border-slate-700 rounded-lg text-left flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold block">{cand.type}</span>
                      <span className="font-mono text-xs text-white font-semibold">{cand.cleanedValue}</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Use</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Success Result Preview Banner */}
          {scannedResult && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-600 rounded-xl flex items-center justify-between gap-3 text-xs text-white animate-in zoom-in-95">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">Scanned Successfully</span>
                  <strong className="font-mono text-sm tracking-wider text-emerald-200">{scannedResult}</strong>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-800 text-white px-2.5 py-1 rounded font-bold">
                Applying ✓
              </span>
            </div>
          )}

          {/* Error Message & Retry */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">Camera Notice</p>
                <p className="text-[11px] text-rose-200/90 leading-normal">{errorMessage}</p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => startLiveCamera()}
                    className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry Live Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    Enter Manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Pro Tips */}
          <div className="bg-[#141824] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed Scanning Tips:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 pl-1">
              <li>On mobile dialer, dial <strong className="text-cyan-300 font-mono">*#06#</strong> to show barcodes on screen.</li>
              <li>Use the <b>2x zoom button</b> if the barcode is small on the box to prevent camera blur.</li>
              <li>Keep the barcode horizontal and inside the green alignment box.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#151924] px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Code-128 • EAN-13 • QR • DataMatrix</span>
          <button
            type="button"
            onClick={() => {
              stopLiveStreams();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#1F2536] hover:bg-[#293249] border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
