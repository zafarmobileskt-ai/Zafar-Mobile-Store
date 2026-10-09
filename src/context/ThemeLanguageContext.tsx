import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TextColorTheme = 'high-contrast' | 'light' | 'amber' | 'emerald';
export type TextSize = 'normal' | 'large' | 'xlarge';
export type Language = 'en' | 'ur' | 'roman';

interface Translations {
  [key: string]: {
    en: string;
    ur: string;
    roman: string;
  };
}

export const translations: Translations = {
  // Navigation & Tabs
  inventory: {
    en: 'Stock (Phones)',
    ur: 'اسٹاک (موبائل)',
    roman: 'Stock (Mobile Phones)'
  },
  intake: {
    en: 'Buy Used Phone',
    ur: 'پرانا موبائل خریدیں',
    roman: 'Purana Phone Kharidain'
  },
  pos: {
    en: 'New Bill / Sale',
    ur: 'نیا بل / فروخت',
    roman: 'Naya Bill / Sale'
  },
  invoices: {
    en: 'All Invoices',
    ur: 'تمام بل اور رسیدیں',
    roman: 'Tamam Bills / Raseedain'
  },
  customers: {
    en: 'Customer Khata',
    ur: 'گاہک اور کھاتہ',
    roman: 'Customer Khata & Udhar'
  },
  analytics: {
    en: 'Profit & Reports',
    ur: 'منافع اور رپورٹس',
    roman: 'Munafa & Reports'
  },
  settings: {
    en: 'Shop Settings',
    ur: 'دکان کی سیٹنگز',
    roman: 'Shop Settings'
  },

  // KPI Stat Cards
  inStock: {
    en: 'In Stock Phones',
    ur: 'دکان میں موجود موبائل',
    roman: 'Mojooda Stock Phones'
  },
  totalSales: {
    en: 'Total Sales Revenue',
    ur: 'کل فروخت آمدنی',
    roman: 'Total Sale Amadni'
  },
  netProfit: {
    en: 'Net Shop Profit',
    ur: 'خالص بچت منافع',
    roman: 'Asal Khata Munafa'
  },
  customerUdhar: {
    en: 'Customer Khata Dues',
    ur: 'گاہکوں کا بقایا ادھار',
    roman: 'Customer Baqi Udhar'
  },

  // Actions
  addDevice: {
    en: 'Add Phone',
    ur: 'نیا موبائل شامل کریں',
    roman: 'Naya Phone Add Karein'
  },
  recordSale: {
    en: 'POS / New Sale',
    ur: 'سیل درج کریں',
    roman: 'Sale Darj Karein'
  },
  exportPdf: {
    en: 'Export All (PDF)',
    ur: 'تمام ریکارڈ پی ڈی ایف',
    roman: 'Master PDF Download'
  },
  backupHub: {
    en: 'Backup Hub',
    ur: 'بیک اپ اور شیٹس',
    roman: 'Backup & Sheets Hub'
  },
  searchPlaceholder: {
    en: 'Search Brand, Model, IMEI (15 digits), Customer...',
    ur: 'برانڈ، ماڈل، آئی ایم ای آئی (15 ہندسے)، گاہک تلاش کریں...',
    roman: 'Brand, Model, IMEI, ya Customer search karein...'
  },
  imeiScan: {
    en: 'IMEI Scan',
    ur: 'آئی ایم ای آئی اسکین',
    roman: 'IMEI Scan'
  },
  quickSale: {
    en: 'Quick Sale',
    ur: 'فوری فروخت',
    roman: 'Fori Sale'
  },
  policeVerification: {
    en: 'Police Anti-Theft Verification',
    ur: 'پولیس چوری پروٹیکشن تصدیق',
    roman: 'Police & Chori Check Record'
  },
  warranty: {
    en: 'Warranty',
    ur: 'وارنٹی',
    roman: 'Warranty'
  },
  save: {
    en: 'Save Changes',
    ur: 'تبدیلیاں محفوظ کریں',
    roman: 'Save Karein'
  },
  cancel: {
    en: 'Cancel',
    ur: 'منسوخ کریں',
    roman: 'Cancel'
  },
  print: {
    en: 'Print Invoice',
    ur: 'بل پرنٹ کریں',
    roman: 'Bill Print Karein'
  },
  shareWhatsapp: {
    en: 'Share on WhatsApp',
    ur: 'واٹس ایپ پر بھیجیں',
    roman: 'WhatsApp Par Bhejein'
  },
  writingColorLabel: {
    en: 'Writing Color & Display',
    ur: 'لکھائی کا رنگ اور اسکرین',
    roman: 'Likhai Ka Color & Display'
  },
  languageLabel: {
    en: 'Language',
    ur: 'زبان',
    roman: 'Zuban (Language)'
  },
  textSizeLabel: {
    en: 'Text Size',
    ur: 'لکھائی کا سائز',
    roman: 'Likhai Ka Size'
  },
  highContrastWhite: {
    en: 'Crisp Bright White (High Contrast)',
    ur: 'روشن سفید لکھائی (زیادہ واضح)',
    roman: 'Chamakdar White (High Contrast)'
  },
  daylightClean: {
    en: 'Daylight Clean (Light Background)',
    ur: 'دن کی روشنی (سفید بیک گراؤنڈ)',
    roman: 'Din Ki Roshni (Light Mode)'
  },
  warmAmber: {
    en: 'Warm Amber Gold (Comfort Reading)',
    ur: 'سنہری لکھائی (آنکھوں کے لیے آرام دہ)',
    roman: 'Sunehri Gold (Comfort Reading)'
  },
  electricEmerald: {
    en: 'Electric Mint (High Visibility)',
    ur: 'سبز روشن لکھائی (تیز نظر)',
    roman: 'Sabz Mint (High Visibility)'
  }
};

interface ThemeLanguageContextType {
  textColorTheme: TextColorTheme;
  setTextColorTheme: (theme: TextColorTheme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

const THEME_KEY = 'zafar_text_color_theme_v1';
const TEXT_SIZE_KEY = 'zafar_text_size_v1';
const LANG_KEY = 'zafar_language_v1';

export const ThemeLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [textColorTheme, setTextColorThemeState] = useState<TextColorTheme>(() => {
    return (localStorage.getItem(THEME_KEY) as TextColorTheme) || 'high-contrast';
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem(TEXT_SIZE_KEY) as TextSize) || 'normal';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LANG_KEY) as Language) || 'en';
  });

  const setTextColorTheme = (theme: TextColorTheme) => {
    setTextColorThemeState(theme);
    localStorage.setItem(THEME_KEY, theme);
  };

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem(TEXT_SIZE_KEY, size);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  // Sync classes to <html> element
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('theme-high-contrast', 'theme-light', 'theme-amber', 'theme-emerald');
    root.classList.add(`theme-${textColorTheme}`);

    // Remove previous size classes
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    root.classList.add(`text-size-${textSize}`);

    // Remove previous lang classes
    root.classList.remove('lang-en', 'lang-ur', 'lang-roman');
    root.classList.add(`lang-${language}`);

    if (language === 'ur') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
  }, [textColorTheme, textSize, language]);

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (!entry) return fallback || key;
    return entry[language] || entry.en || fallback || key;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        textColorTheme,
        setTextColorTheme,
        textSize,
        setTextSize,
        language,
        setLanguage,
        t
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = (): ThemeLanguageContextType => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
