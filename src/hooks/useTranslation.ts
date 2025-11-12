import { useI18n } from '@/i18n/useI18n';

/**
 * A convenience hook that re-exports the `useI18n` context hook.
 * This provides a clean, consistent, and abstracted API for components to
 * access translation functions and language state.
 *
 * If the underlying i18n implementation were to change, components would
 * not need to be refactored, as they all depend on this hook.
 *
 * @returns The i18n context value, including:
 * - `t`: The translation function.
 * - `language`: The current language code ('zh', 'en', 'ja').
 * - `setLanguage`: A function to change the current language.
 */
export const useTranslation = useI18n;