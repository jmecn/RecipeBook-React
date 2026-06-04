export const FALLBACK_LOCALE = 'en_us';
export const LOCALE_STORAGE_KEY = 'recipeViewerLocale';

export function normalizeLocale(value: string | null | undefined): string {
  return String(value || FALLBACK_LOCALE).trim().toLowerCase().replace(/-/g, '_');
}
