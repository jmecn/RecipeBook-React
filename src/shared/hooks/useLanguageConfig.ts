import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/http';
import { siteUrl } from '../lib/site-base';
import {
  FALLBACK_LOCALE,
  normalizeLocale,
  type UiMessages,
} from '../i18n/messages';

export interface LanguageConfig {
  defaultLocale: string;
  enabledLocales: string[];
  localeNames: Record<string, string>;
  uiText: Partial<Record<string, Partial<UiMessages>>>;
}

function normalizeLanguageConfig(raw: unknown): LanguageConfig {
  const cfg = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const enabledLocales = Array.isArray(cfg.enabledLocales)
    ? cfg.enabledLocales.map((code) => normalizeLocale(String(code))).filter(Boolean)
    : [];

  const localeNames: Record<string, string> = {};
  if (cfg.localeNames && typeof cfg.localeNames === 'object') {
    for (const [code, label] of Object.entries(cfg.localeNames as Record<string, unknown>)) {
      if (typeof label === 'string' && label.trim()) {
        localeNames[normalizeLocale(code)] = label.trim();
      }
    }
  }

  const uiText: Partial<Record<string, Partial<UiMessages>>> = {};
  if (cfg.uiText && typeof cfg.uiText === 'object') {
    for (const [code, table] of Object.entries(cfg.uiText as Record<string, unknown>)) {
      if (table && typeof table === 'object') {
        uiText[normalizeLocale(code)] = table as Partial<UiMessages>;
      }
    }
  }

  return {
    defaultLocale: normalizeLocale(String(cfg.defaultLocale || FALLBACK_LOCALE)),
    enabledLocales,
    localeNames,
    uiText,
  };
}

const FALLBACK_CONFIG: LanguageConfig = {
  defaultLocale: 'en_us',
  enabledLocales: ['en_us', 'zh_cn'],
  localeNames: {
    en_us: 'English (US)',
    zh_cn: '简体中文',
  },
  uiText: {},
};

export function useLanguageConfig() {
  return useQuery({
    queryKey: ['language-config'],
    queryFn: async () => {
      const raw = await fetchJson(siteUrl('language.json'), null);
      return normalizeLanguageConfig(raw);
    },
    staleTime: Infinity,
    placeholderData: FALLBACK_CONFIG,
  });
}

export function localeDisplayName(
  config: LanguageConfig | undefined,
  locale: string,
) {
  const key = normalizeLocale(locale);
  return config?.localeNames?.[key] || key;
}

export function visibleLocales(
  config: LanguageConfig | undefined,
  bundleLanguages: string[] | undefined,
): string[] {
  const fromBundle = bundleLanguages?.length ? bundleLanguages : ['en_us'];
  const enabled = config?.enabledLocales ?? [];
  const langs = enabled.length > 0
    ? fromBundle.filter((code) => enabled.includes(normalizeLocale(code)))
    : fromBundle;
  return langs.length > 0 ? langs : [config?.defaultLocale || FALLBACK_LOCALE];
}
