import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  resolveUiMessages,
} from './messages';
import { buildAppUrl, parseLocationQuery } from '../lib/location-query';
import { useLanguageConfig } from '../hooks/useLanguageConfig';

export function useI18n() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseLocationQuery(location.search);
  const langConfigQuery = useLanguageConfig();

  const locale = useMemo(() => {
    if (route.lang) return normalizeLocale(route.lang);
    const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY);
    return fromStorage ? normalizeLocale(fromStorage) : FALLBACK_LOCALE;
  }, [route.lang]);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (next: string) => {
    const normalized = normalizeLocale(next);
    navigate(buildAppUrl({ ...route, lang: normalized }));
  };

  const text = useMemo(
    () => resolveUiMessages(locale, langConfigQuery.data?.uiText),
    [locale, langConfigQuery.data?.uiText],
  );

  return {
    locale,
    text,
    setLocale,
  };
}
