
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const languages = { en, es };
const supportedLanguages = Object.keys(languages);
const defaultLang = 'en';

type Language = keyof typeof languages;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: string) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function normalizeLang(code: string | null | undefined): Language {
  if (!code) return defaultLang;
  const base = code.toLowerCase();
  if (supportedLanguages.includes(base)) return base as Language;
  const short = base.split("-")[0];
  return supportedLanguages.includes(short) ? (short as Language) : defaultLang;
}

function loadInitialLang(userLanguage?: string): Language {
    if (userLanguage) {
        return normalizeLang(userLanguage);
    }
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('vesper-lang');
        if (saved) return normalizeLang(saved);
        return normalizeLang(navigator.language);
    }
    return defaultLang;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => loadInitialLang(user?.language));

  useEffect(() => {
    // This effect ensures that when the user logs in and their profile data is available,
    // their saved language preference is applied.
    setLanguageState(loadInitialLang(user?.language));
  }, [user]);

  const setLanguage = (lang: string) => {
    const normalized = normalizeLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vesper-lang', normalized);
    }
    setLanguageState(normalized);
  };
  
  const interpolate = (str: string, params: { [key: string]: string | number } = {}) => {
      return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(params[k] ?? ""));
  };

  const t = useCallback((key: string, options: { [key: string]: string | number } = {}): string => {
    const langPack = languages[language] || languages[defaultLang];
    const keys = key.split('.');
    
    let raw: any = langPack;
    for (const k of keys) {
        raw = raw?.[k];
        if (raw === undefined) break;
    }
    
    if (raw === undefined) {
        let fallbackResult: any = languages[defaultLang];
        for (const k of keys) {
            fallbackResult = fallbackResult?.[k];
            if (fallbackResult === undefined) return key;
        }
        raw = fallbackResult;
    }

    if (typeof raw === "object" && options.hasOwnProperty('count')) {
        const count = Number(options.count);
        const form = count === 1 ? raw.one : raw.other;
        return interpolate(form, options);
    }
    
    return interpolate(String(raw), options);

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
    { "code": "fr", "name": "Français (French)" },
    { "code": "de", "name": "Deutsch (German)" },
    { "code": "pt", "name": "Português (Portuguese)" },
    { "code": "it", "name": "Italiano (Italian)" },
    { "code": "ru", "name": "Русский (Russian)" },
    { "code": "ar", "name": "العربية (Arabic)" },
    { "code": "hi", "name": "हिन्दी (Hindi)" },
    { "code": "zh", "name": "中文 (Mandarin)" }
];
