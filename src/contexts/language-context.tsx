
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const languages = { en, es };

type Language = keyof typeof languages;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('vesper-lang') as Language;
    if (savedLanguage && languages[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('vesper-lang', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let result: any = languages[language];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            // Fallback to English if key not found in current language
            let fallbackResult: any = languages['en'];
            for (const fk of keys) {
                fallbackResult = fallbackResult?.[fk];
                if (fallbackResult === undefined) return key;
            }
            result = fallbackResult;
            break;
        }
    }

    if (typeof result === 'string' && options) {
        return Object.entries(options).reduce((acc, [key, value]) => {
            return acc.replace(`{{${key}}}`, String(value));
        }, result);
    }
    
    return result || key;
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const languageOptions: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
];
