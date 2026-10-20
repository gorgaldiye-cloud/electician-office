import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations.en;
  formatMoney: (amount: number | null | undefined) => string;
  formatPhone: (phone: string) => string;
  formatDate: (isoDate: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('abc_lang');
      return saved === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });

  const direction = language === 'ur' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    localStorage.setItem('abc_lang', language);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const t = translations[language];

  const formatMoney = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) {
      return language === 'ur' ? 'معائنہ درکار ہے' : 'Inspection Required';
    }
    const formatted = new Intl.NumberFormat('en-PK').format(amount);
    return language === 'ur' ? `${formatted} روپے` : `PKR ${formatted}`;
  };

  const formatPhone = (phone: string): string => {
    if (!phone) return '';
    // Format +923001234567 to +92 300 1234567
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length === 12) {
      return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return phone;
  };

  const formatDate = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Karachi',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        toggleLanguage,
        t,
        formatMoney,
        formatPhone,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
