
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const languages = { en, es };

type Language = keyof typeof languages;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (user?.language) {
        setLanguageState(user.language);
    } else {
        const savedLanguage = localStorage.getItem('vesper-lang') as Language;
        if (savedLanguage && languages[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
    }
  }, [user]);

  const setLanguage = (lang: string) => {
    if (languages.hasOwnProperty(lang)) {
        localStorage.setItem('vesper-lang', lang);
        setLanguageState(lang as Language);
    }
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let result: any = languages[language] || languages['en']; // Fallback to English if language file doesn't exist
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

export const allLanguageOptions: { code: string, name: string }[] = [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Español (Spanish)" },
    { "code": "zh", "name": "中文 (Mandarin)" },
    { "code": "hi", "name": "हिन्दी (Hindi)" },
    { "code": "ar", "name": "العربية (Arabic)" },
    { "code": "bn", "name": "বাংলা (Bengali)" },
    { "code": "pt", "name": "Português (Portuguese)" },
    { "code": "ru", "name": "Русский (Russian)" },
    { "code": "ja", "name": "日本語 (Japanese)" },
    { "code": "de", "name": "Deutsch (German)" },
    { "code": "fr", "name": "Français (French)" },
    { "code": "ko", "name": "한국어 (Korean)" },
    { "code": "tr", "name": "Türkçe (Turkish)" },
    { "code": "it", "name": "Italiano (Italian)" },
    { "code": "nl", "name": "Nederlands (Dutch)" },
    { "code": "pl", "name": "Polski (Polish)" },
    { "code": "sv", "name": "Svenska (Swedish)" },
    { "code": "fi", "name": "Suomi (Finnish)" },
    { "code": "no", "name": "Norsk (Norwegian)" },
    { "code": "da", "name": "Dansk (Danish)" },
    { "code": "cs", "name": "Čeština (Czech)" },
    { "code": "hu", "name": "Magyar (Hungarian)" },
    { "code": "ro", "name": "Română (Romanian)" },
    { "code": "el", "name": "Ελληνικά (Greek)" },
    { "code": "he", "name": "עברית (Hebrew)" },
    { "code": "th", "name": "ไทย (Thai)" },
    { "code": "vi", "name": "Tiếng Việt (Vietnamese)" },
    { "code": "id", "name": "Bahasa Indonesia (Indonesian)" },
    { "code": "ms", "name": "Bahasa Melayu (Malay)" },
    { "code": "fa", "name": "فارسی (Persian)" }
];
