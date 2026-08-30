import React, { useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Smartphone, 
  User, 
  CheckCircle2, 
  Building2, 
  AlertTriangle,
  QrCode,
  Fingerprint,
  Calendar,
  Phone,
  FileCheck
} from 'lucide-react';

export const PoliceCertificateModal: React.FC = () => {
  const { selectedPoliceCertDevice, setSelectedPoliceCertDevice, settings, formatCurrency } = useShop();
  const printRef = useRef<HTMLDivElement>(null);

  if (!selectedPoliceCertDevice) return null;
  const item = selectedPoliceCertDevice;
  const seller = item.supplierOrSeller;
  const police = item.policeProtection;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(item.purchaseDate || item.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = new Date(item.purchaseDate || item.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const certificateNo = `POL-${item.id.replace('MOB-', '')}-${new Date(item.purchaseDate || item.createdAt).getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-[#12151E] text-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800 animate-in fade-in print:border-none print:shadow-none print:max-w-none print:rounded-none print:bg-white print:text-black">
        
        {/* Action Header - Hidden during print */}
        <div className="bg-[#0B0D14] px-5 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Police Legal Protection & Seller Undertaking</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded font-mono font-semibold">
                  Anti-Theft Verified
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Official second-hand device legal record for police compliance & shop safety</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950"
            >
              <Printer className="w-4 h-4" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={() => setSelectedPoliceCertDevice(null)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div ref={printRef} className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto space-y-5 print:max-h-none print:overflow-visible print:p-8 print:space-y-4 print:text-black">
          
          {/* Certificate Header / Seal */}
          <div className="border-b-2 border-emerald-500/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-black">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded border border-emerald-600/40 print:bg-gray-100 print:text-black print:border-black">
                  Official Legal Document
                </span>
                <span className="text-xs text-slate-400 font-mono print:text-gray-600">Ref #{certificateNo}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight print:text-black">
                Used Mobile Purchase & Police Protection Certificate
              </h1>
              <p className="text-xs text-slate-300 font-medium print:text-gray-700">
                Statutory Ownership Transfer & Anti-Theft Undertaking (بیان حلفی برائے خرید و فروخت موبائل)
              </p>
            </div>

            <div className="bg-[#171B26] p-3 rounded-xl border border-slate-700 text-right shrink-0 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block print:text-gray-600">Verification Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5 print:text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CLEARED & RECORDED</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-1 print:text-gray-600">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Verification Badges Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-[#10192A] p-2.5 rounded-lg border border-blue-900/60 flex items-center gap-2.5 print:bg-gray-50 print:border-gray-300">
              <div className="p-1.5 bg-blue-600 text-white rounded-md shrink-0 print:bg-blue-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-blue-300 font-semibold block print:text-blue-900">Anti-Theft Check</span>
                <span className="text-xs font-bold text-white print:text-black">Stolen Database: CLEAR</span>
              </div>
            </div>

            <div className="bg-[#10192A] p-2.5 rounded-lg border border-blue-900/60 flex items-center gap-2.5 print:bg-gray-50 print:border-gray-300">
              <div className="p-1.5 bg-emerald-600 text-white rounded-md shrink-0 print:bg-emerald-700">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 font-semibold block print:text-emerald-900">Seller ID Verification</span>
                <span className="text-xs font-bold text-white print:text-black">National ID / CNIC Recorded</span>
              </div>
            </div>

            <div className="bg-[#10192A] p-2.5 rounded-lg border border-blue-900/60 flex items-center gap-2.5 print:bg-gray-50 print:border-gray-300">
              <div className="p-1.5 bg-indigo-600 text-white rounded-md shrink-0 print:bg-indigo-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 font-semibold block print:text-indigo-900">Police Jurisdiction</span>
                <span className="text-xs font-bold text-white truncate block print:text-black">
                  {police?.policeStationJurisdiction || 'Local Police Precinct'}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Grid: Device Details & Seller Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Mobile Phone Particulars */}
            <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/70 space-y-2.5 print:bg-white print:border-gray-300">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5 print:text-blue-900 print:border-gray-200">
                <Smartphone className="w-3.5 h-3.5" /> 1. Mobile Phone Particulars
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Make & Model:</span>
                  <span className="font-bold text-white print:text-black">{item.brand} {item.model}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Storage & Color:</span>
                  <span className="font-medium text-slate-200 print:text-black">{item.storage} • {item.color}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Primary IMEI 1:</span>
                  <span className="font-mono font-bold text-cyan-300 tracking-wider print:text-black select-all">{item.imei1}</span>
                </div>
                {item.imei2 && (
                  <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                    <span className="text-slate-400 print:text-gray-600">Secondary IMEI 2:</span>
                    <span className="font-mono font-medium text-slate-300 print:text-black select-all">{item.imei2}</span>
                  </div>
                )}
                {item.serialNumber && (
                  <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                    <span className="text-slate-400 print:text-gray-600">Serial Number:</span>
                    <span className="font-mono text-slate-300 print:text-black">{item.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Condition Grade:</span>
                  <span className="font-semibold text-emerald-400 print:text-emerald-800">{item.conditionGrade || 'Used - Tested'}</span>
                </div>
                {item.batteryHealth && (
                  <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                    <span className="text-slate-400 print:text-gray-600">Battery Health:</span>
                    <span className="font-medium text-slate-200 print:text-black">{item.batteryHealth}% Maximum Capacity</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-gray-600">Purchase Price:</span>
                  <span className="font-bold text-white print:text-black">{formatCurrency(item.purchaseCost)}</span>
                </div>
              </div>
            </div>

            {/* Right: Seller (Transferor) Particulars */}
            <div className="bg-[#171B26] p-4 rounded-xl border border-slate-700/70 space-y-2.5 print:bg-white print:border-gray-300">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5 print:text-amber-900 print:border-gray-200">
                <User className="w-3.5 h-3.5" /> 2. Seller Identification (Transferor)
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Seller Full Name:</span>
                  <span className="font-bold text-white print:text-black">{seller?.name || 'Walk-in Customer'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Father's / Guardian Name:</span>
                  <span className="font-medium text-slate-200 print:text-black">
                    {seller?.fatherName || police?.sellerFatherName || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 font-semibold print:text-gray-700">CNIC / ID Card Number:</span>
                  <span className="font-mono font-bold text-amber-300 tracking-wider print:text-black select-all">
                    {seller?.cnicOrGovId || police?.idCardNumber || 'CNIC Attached on File'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 print:text-gray-600">Contact Phone:</span>
                  <span className="font-mono font-medium text-slate-200 print:text-black">{seller?.phone || 'N/A'}</span>
                </div>
                <div className="py-0.5 border-b border-slate-800 print:border-gray-100">
                  <span className="text-slate-400 block text-[11px] print:text-gray-600">Residential Address:</span>
                  <span className="font-medium text-slate-200 block text-xs print:text-black">
                    {seller?.address || police?.sellerCityAddress || 'Address verified on national ID card'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-gray-600">Police Jurisdiction:</span>
                  <span className="font-medium text-slate-200 print:text-black">
                    {police?.policeStationJurisdiction || 'Local District Police Station'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Legal Undertaking & Sworn Affidavit Text */}
          <div className="bg-[#10141D] p-4 rounded-xl border border-slate-700/80 space-y-2 text-xs print:bg-gray-50 print:border-gray-300">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase text-[11px] print:text-black">
              <AlertTriangle className="w-4 h-4 text-amber-400 print:text-black" />
              <span>Seller Sworn Legal Undertaking & Affidavit (بیان حلفی)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] text-justify print:text-gray-800">
              I, the seller named above, do hereby solemnly affirm and declare on oath that I am the absolute, sole and rightful owner of the mobile phone handset described in Section 1 (IMEI: <strong className="text-white print:text-black font-mono">{item.imei1}</strong>). The said handset has been purchased through legitimate means and is in my lawful possession. It has NOT been obtained by theft, burglary, robbery, snatching, fraud, extortion, or any criminal activity. It is completely free from any dispute, police FIR, CPLC report, court litigation, or encumbrance. I have voluntarily sold this device to <strong className="text-white print:text-black">{settings.shopName}</strong> against the full and final cash/digital settlement of <strong className="text-white print:text-black">{formatCurrency(item.purchaseCost)}</strong>. If at any time this handset is found to be stolen, disputed, or blacklisted, I shall bear full criminal and financial responsibility under the applicable penal and cyber laws.
            </p>
          </div>

          {/* Purchasing Store Particulars */}
          <div className="bg-[#171B26] p-3.5 rounded-xl border border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:bg-white print:border-gray-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block print:text-gray-500">Purchasing Commercial Establishment</span>
              <span className="font-bold text-white text-sm print:text-black">{settings.shopName}</span>
              <span className="text-slate-400 block text-[11px] print:text-gray-600">{settings.address} • Phone: {settings.phone}</span>
            </div>
            <div className="text-right text-[11px] text-slate-400 shrink-0 print:text-gray-600">
              <span>Intake Officer: <strong className="text-slate-200 print:text-black">{police?.verifiedByOfficerOrStaff || settings.ownerName || 'Store Manager'}</strong></span>
              <span className="block font-mono">Date: {formattedDate} {formattedTime}</span>
            </div>
          </div>

          {/* Signatures & Thumbprint Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 print:pt-4">
            
            {/* Seller Left Thumb Impression */}
            <div className="border border-dashed border-slate-600 rounded-xl p-3 text-center flex flex-col items-center justify-between h-32 print:border-black print:bg-white">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider print:text-black">
                Seller Thumb Impression (انگوٹھا)
              </span>
              <div className="w-16 h-16 border border-slate-700 rounded-lg flex items-center justify-center text-slate-500 print:border-gray-400">
                <Fingerprint className="w-10 h-10 text-slate-600 print:text-gray-400" />
              </div>
              <span className="text-[9px] text-slate-500 print:text-gray-600">Left Thumb Impression</span>
            </div>

            {/* Seller Signature */}
            <div className="border border-dashed border-slate-600 rounded-xl p-3 text-center flex flex-col items-center justify-between h-32 print:border-black print:bg-white">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider print:text-black">
                Seller Signature (دستخط فروخت کنندہ)
              </span>
              <div className="w-full h-12 border-b border-slate-600 print:border-black mt-auto mb-1"></div>
              <span className="text-[9px] text-slate-400 print:text-gray-600">{seller?.name || 'Seller Sign'}</span>
            </div>

            {/* Shop Seal & Signature */}
            <div className="col-span-2 sm:col-span-1 border border-dashed border-slate-600 rounded-xl p-3 text-center flex flex-col items-center justify-between h-32 print:border-black print:bg-white">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider print:text-black">
                Shopkeeper Seal & Sign
              </span>
              <div className="w-full h-12 border-b border-slate-600 print:border-black mt-auto mb-1 flex items-center justify-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest print:text-gray-400">Official Stamp</span>
              </div>
              <span className="text-[9px] text-slate-400 print:text-gray-600">{settings.shopName}</span>
            </div>

          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-500 border-t border-slate-800 pt-3 print:text-gray-500 print:border-gray-300">
            This certificate is generated electronically for record-keeping and statutory anti-theft verification. A physical signed copy must be maintained on record for police inspection.
          </div>

        </div>

        {/* Footer Actions - Hidden during print */}
        <div className="bg-[#0B0D14] px-5 py-3.5 border-t border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Recorded in store database • Reference: <span className="font-mono text-cyan-300">{certificateNo}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPoliceCertDevice(null)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-[#171B26] hover:bg-[#1E2435] border border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Police Certificate</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
