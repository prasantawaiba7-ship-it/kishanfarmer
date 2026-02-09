import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, languages } from '@/lib/languages';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cropic-language');
    if (saved && (saved === 'en' || saved === 'ne')) {
      return saved as Language;
    }
    return 'ne'; // Default to Nepali for Nepal
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cropic-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

const fallbackContext: LanguageContextType = {
  language: 'ne' as Language,
  setLanguage: () => {},
  t: (key: string) => translations?.['ne']?.[key] || translations?.['en']?.[key] || key,
  languages,
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage called outside LanguageProvider, using fallback');
    return fallbackContext;
  }
  return context;
}
