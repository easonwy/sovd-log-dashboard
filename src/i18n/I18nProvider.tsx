import { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { Language } from '@/types';
import { translations } from './translations';

/**
 * Defines the shape of the context that will be provided to components.
 */
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create the context with an initial undefined value.
const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * The provider component that wraps the application.
 * It holds the language state and provides the context value to its children.
 */
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('zh'); // Default language is Chinese

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

/**
 * A custom hook to consume the i18n context.
 * It provides a safe way to access the context, throwing an error
 * if it's used outside of an I18nProvider.
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};