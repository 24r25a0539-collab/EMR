import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { translations, LANGUAGES, LanguageOption } from '../i18n';
import { displayLocalizedValue, LocalizedValueType } from '../utils/dynamicLocalizer';

export type Language = LanguageCode;
export { displayLocalizedValue };
export type { LocalizedValueType };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string, params?: Record<string, string>) => string;
  localizeValue: (actualValue: string | undefined | null, valueType?: LocalizedValueType) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('emr_language') as LanguageCode;
    return saved && translations[saved] ? saved : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('emr_language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string, params?: Record<string, string>): string => {
    let result = key;
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      result = langDict[key];
    } else if (translations.en[key]) {
      result = translations.en[key];
    } else {
      result = fallback || key;
    }
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), v);
      });
    }
    return result;
  };

  const localizeValue = (actualValue: string | undefined | null, valueType?: LocalizedValueType): string => {
    return displayLocalizedValue(actualValue, language, valueType);
  };

  const currentLanguageOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, localizeValue, languages: LANGUAGES, currentLanguageOption }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
