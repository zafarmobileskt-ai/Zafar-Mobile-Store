import React from 'react';
import { useThemeLanguage, TextColorTheme, TextSize, Language } from '../context/ThemeLanguageContext';
import { 
  X, 
  Palette, 
  Languages, 
  Check, 
  Sun, 
  Moon, 
  Sparkles, 
  Eye,
  Type
} from 'lucide-react';

interface ReadabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadabilityModal: React.FC<ReadabilityModalProps> = ({ isOpen, onClose }) => {
  const { 
    textColorTheme, 
    setTextColorTheme, 
    textSize, 
    setTextSize, 
    language, 
    setLanguage,
    t
  } = useThemeLanguage();

  if (!isOpen) return null;

  const colorThemes: { id: TextColorTheme; name: string; urduName: string; desc: string; bgPreview: string; textPreview: string; icon: React.ReactNode }[] = [
    {
      id: 'high-contrast',
      name: 'Bright White (High Contrast)',
      urduName: 'روشن سفید لکھائی (بہترین کوالٹی)',
      desc: 'Pure crisp white typography with elevated contrast on dark charcoal background.',
      bgPreview: '#0A0B0E',
      textPreview: '#FFFFFF',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'light',
      name: 'Daylight Clean (Light Mode)',
      urduName: 'دن کی روشنی (سفید بیک گراؤنڈ)',
      desc: 'Crisp white canvas with bold dark writing. Recommended for bright sunlight or if you struggle with dark themes.',
      bgPreview: '#F8FAFC',
      textPreview: '#0F172A',
      icon: <Sun className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'amber',
      name: 'Warm Amber Gold',
      urduName: 'سنہری لکھائی (آنکھوں کے لیے پرسکون)',
      desc: 'High-contrast warm yellow gold writing on obsidian slate. Ultra comfortable for night reading.',
      bgPreview: '#0C0D10',
      textPreview: '#FEF08A',
      icon: <Eye className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'emerald',
      name: 'Electric Mint Green',
      urduName: 'سبز روشن لکھائی (تیز نظر)',
      desc: 'High-clarity mint green writing on deep dark slate. Sharp and distinctive visibility.',
      bgPreview: '#050C0A',
      textPreview: '#6EE7B7',
      icon: <Moon className="w-4 h-4 text-emerald-400" />
    }
  ];

  const languagesList: { id: Language; label: string; sub: string }[] = [
    { id: 'en', label: 'English', sub: 'Standard International English' },
    { id: 'ur', label: 'اردو', sub: 'اردو زبان (موبائل اسٹاک اور کھاتہ)' },
    { id: 'roman', label: 'Roman Urdu', sub: 'Aasan Urdu (Mobile Market Roman Alfaz)' }
  ];

  const textSizes: { id: TextSize; label: string; sample: string; desc: string }[] = [
    { id: 'normal', label: 'Standard', sample: 'Aa', desc: 'Standard compact display' },
    { id: 'large', label: 'Large (+15%)', sample: 'Aa+', desc: 'Easier to read on phones' },
    { id: 'xlarge', label: 'Extra Large (+30%)', sample: 'Aa++', desc: 'Maximum visibility across counter' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#12151E] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t('writingColorLabel', 'Writing Color & Display Readability')}</span>
              </h2>
              <p className="text-xs text-slate-300">
                Customize text contrast, writing colors, font size, and shop language.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* 1. Writing Color / Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                <span>Writing Text Color & Theme (لکھائی کا رنگ)</span>
              </label>
              <span className="text-[11px] text-blue-400 font-medium">Instant Live Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {colorThemes.map((thm) => {
                const isSelected = textColorTheme === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => setTextColorTheme(thm.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-md'
                        : 'border-slate-800 bg-[#161924] hover:border-slate-700 hover:bg-[#1a1e2d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {thm.icon}
                        <span className="text-xs font-bold text-white">{thm.name}</span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300 font-urdu">{thm.urduName}</div>

                    {/* Preview Box */}
                    <div 
                      className="p-2 rounded-lg border border-slate-700/60 text-xs font-medium flex items-center justify-between"
                      style={{ backgroundColor: thm.bgPreview, color: thm.textPreview }}
                    >
                      <span className="font-semibold">Sample Writing Text</span>
                      <span className="text-[10px] opacity-80 font-mono">123,450 PKR</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">{thm.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Text Size (Readability Zoom) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              <span>{t('textSizeLabel', 'Text Readability Size (لکھائی کا سائز)')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {textSizes.map((sz) => {
                const isSelected = textSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setTextSize(sz.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/50'
                        : 'border-slate-800 bg-[#161924] hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg font-bold text-white">{sz.sample}</span>
                    <span className="text-xs font-semibold text-slate-200">{sz.label}</span>
                    <span className="text-[10px] text-slate-400">{sz.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Writing Language Selection */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-400" />
              <span>{t('languageLabel', 'Shop Language (دکان کی زبان اور لکھائی)')}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {languagesList.map((lng) => {
                const isSelected = language === lng.id;
                return (
                  <button
                    key={lng.id}
                    type="button"
                    onClick={() => setLanguage(lng.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/50 shadow-md'
                        : 'border-slate-800 bg-[#161924] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{lng.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">{lng.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#151924] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Current: <b className="text-white capitalize">{textColorTheme.replace('-', ' ')}</b> • <b className="text-white uppercase">{language}</b>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {t('save', 'Apply & Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
