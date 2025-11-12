import { createContext } from 'react';
import { Language } from '@/types';

/**
 * Defines the shape of the context that will be provided to components.
 */
export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create the context with an initial undefined value.
export const I18nContext = createContext<I18nContextType | undefined>(undefined);
