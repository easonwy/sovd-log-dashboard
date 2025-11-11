// src/i18n/I18nProvider.tsx
import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { Language } from '@/types';
import { translations } from './translations';

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const t = useCallback((key: string): string => {
    return (translations[language] as any)[key] || key;
  }, [language]);

  const value = { language, setLanguage, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};