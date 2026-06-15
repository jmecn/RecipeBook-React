import i18n, { type BackendModule, type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fetchJson } from '../api/http';
import { resolveAppLocale } from '../lib/app-locale';
import { siteUrl } from '../lib/site-base';
import { FALLBACK_LOCALE, normalizeLocale } from './locale';

let initPromise: Promise<void> | null = null;

function fallbackChainFor(code: string): string[] {
  const locale = normalizeLocale(code);
  return locale === FALLBACK_LOCALE ? [] : [FALLBACK_LOCALE];
}

const localeBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language, _namespace, callback) => {
    const locale = normalizeLocale(language);
    void fetchJson<Record<string, unknown> | null>(siteUrl(`locales/${locale}.json`), null).then(
      (data) => {
        if (data) callback(null, data);
        else callback(new Error(`missing locale file: ${locale}`), false);
      },
    );
  },
};

const initOptions: InitOptions = {
  lng: resolveAppLocale(),
  fallbackLng: (code) => fallbackChainFor(code),
  compatibilityJSON: 'v4',
  partialBundledLanguages: true,
  load: 'currentOnly',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};

export function ensureI18nReady(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = i18n
    .use(localeBackend)
    .use(initReactI18next)
    .init(initOptions)
    .then(() => undefined);
  return initPromise;
}

export default i18n;
