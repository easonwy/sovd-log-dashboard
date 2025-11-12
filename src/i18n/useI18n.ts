import { useContext } from 'react';
import { I18nContext } from './I18nContext';

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
