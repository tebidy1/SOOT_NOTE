'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

type Locale = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  t: typeof ar; // Using 'ar' as the shape for translations
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale) {
      setLocaleState(savedLocale);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ar') {
        setLocaleState('ar');
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const t = locale === 'ar' ? ar : en;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  
  const value = { locale, setLocale, t, direction };
  
  return (
    <I18nContext.Provider value={value}>
        {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
