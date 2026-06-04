import { FALLBACK_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '../i18n/locale';
import { parseLocationQuery } from './location-query';

export function resolveAppLocale(search = window.location.search): string {
  const route = parseLocationQuery(search);
  return normalizeLocale(
    route.lang || localStorage.getItem(LOCALE_STORAGE_KEY) || FALLBACK_LOCALE,
  );
}
