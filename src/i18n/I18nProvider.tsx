import { useState, useCallback, ReactNode } from 'react';
import { Language } from '@/types';
import { I18nContext } from './I18nContext';
import { translations } from './translations';

/**
 * The provider component that wraps the application.
 * It holds the language state and provides the context value to its children.
 */
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en'); // Default language is English

  /**
   * The translation function. It looks up a key in the current language's
   * dictionary. If the key is not found, it returns the key itself as a fallback.
   * `useCallback` is used for performance, ensuring the function reference
   * only changes when the language changes.
   */
  const t = useCallback((key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  }, [language]);

  // The value that will be passed down to consuming components.
  const value = { language, setLanguage, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};