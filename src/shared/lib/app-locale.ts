import { FALLBACK_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '../i18n/messages';
import { parseLocationQuery } from './location-query';

/** URL `?lang=` wins, then localStorage, then default (same rules as boot + shell i18n). */
export function resolveAppLocale(search = window.location.search): string {
  const route = parseLocationQuery(search);
  return normalizeLocale(
    route.lang || localStorage.getItem(LOCALE_STORAGE_KEY) || FALLBACK_LOCALE,
  );
}
