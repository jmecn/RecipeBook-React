import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { hideEmiTagPopover } from 'emi-recipe-renderer';
import { getEmiRendererClient } from '../../adapters/emi-renderer/client';
import { loadItemsLangPayload } from '../../features/item-list/model/items-lang';
import { useBundlesManifestQuery } from '../../features/bundle/model/queries';
import { bundleBaseUrl } from '../../shared/api/http';
import { resolveBundleId } from '../../shared/lib/bundle';
import { buildAppUrl, parseLocationQuery } from '../../shared/lib/location-query';
import i18n from '../../shared/i18n/i18n';
import { useI18n } from '../../shared/i18n/useI18n';
import { LOCALE_STORAGE_KEY, normalizeLocale } from '../../shared/i18n/locale';
import { getActiveTheme } from '../../shared/lib/theme';
import { AppLangTransition } from '../ui/AppLangTransition';

function doubleAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

interface LocaleSwitchContextValue {
  setRouteLocale: (next: string) => void;
  switchLocale: (next: string) => Promise<void>;
}

const LocaleSwitchContext = createContext<LocaleSwitchContextValue | null>(null);

export function LocaleSwitchProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const route = parseLocationQuery(location.search);
  const { locale } = useI18n();
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('');

  const setRouteLocale = useCallback(
    (next: string) => {
      const normalized = normalizeLocale(next);
      if (normalized === locale) return;
      localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
      navigate(buildAppUrl({ ...route, lang: normalized }));
    },
    [locale, navigate, route],
  );

  const switchLocale = useCallback(
    async (next: string) => {
      const normalized = normalizeLocale(next);
      if (normalized === locale) return;

      setStatus(i18n.t('switchingLanguage', { lng: normalized }));
      setVisible(true);
      document.body.classList.add('is-transitioning-lang');

      await doubleAnimationFrame();

      try {
        hideEmiTagPopover(document.getElementById('tag-popover'));
        localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
        await i18n.changeLanguage(normalized);
        navigate(buildAppUrl({ ...route, lang: normalized }));

        if (bundleId) {
          const items = queryClient.getQueryData<string[]>(['items-catalog', bundleId]) ?? [];
          const langPayload = await queryClient.fetchQuery({
            queryKey: ['items-lang', bundleId, normalized],
            queryFn: () => loadItemsLangPayload(bundleId, normalized, items),
          });
          const client = getEmiRendererClient();
          await client.configure({
            baseUrl: bundleBaseUrl(bundleId),
            locale: normalized,
            theme: getActiveTheme(),
            registryLabels: langPayload.labels,
          });
          client.setRegistryLabels(langPayload.labels);
        }
      } finally {
        setVisible(false);
        document.body.classList.remove('is-transitioning-lang');
      }
    },
    [bundleId, locale, navigate, queryClient, route],
  );

  const value = useMemo(
    () => ({ setRouteLocale, switchLocale }),
    [setRouteLocale, switchLocale],
  );

  return (
    <LocaleSwitchContext.Provider value={value}>
      {children}
      <AppLangTransition visible={visible} status={status} />
    </LocaleSwitchContext.Provider>
  );
}

export function useLocaleSwitch() {
  const ctx = useContext(LocaleSwitchContext);
  if (!ctx) {
    throw new Error('useLocaleSwitch must be used within LocaleSwitchProvider');
  }
  return ctx;
}
