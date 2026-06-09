import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { buildAppUrl } from '../lib/location-query';
import { useAppRoute } from '../hooks/useAppRoute';
import { FALLBACK_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from './locale';

export function useAppLocale() {
  const navigate = useNavigate();
  const route = useAppRoute();
  const { i18n } = useTranslation();

  const locale = useMemo(() => {
    if (route.lang) return normalizeLocale(route.lang);
    const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY);
    return fromStorage ? normalizeLocale(fromStorage) : FALLBACK_LOCALE;
  }, [route.lang]);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    if (normalizeLocale(i18n.language) !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  useEffect(() => {
    document.title = i18n.t('appTitle');
  }, [i18n, i18n.language]);

  const setLocale = (next: string) => {
    navigate(buildAppUrl({ ...route, lang: normalizeLocale(next) }));
  };

  return { locale, setLocale, i18n };
}

export function useI18n() {
  const { t } = useTranslation();
  const { locale, setLocale, i18n } = useAppLocale();
  return { locale, setLocale, t, i18n };
}
