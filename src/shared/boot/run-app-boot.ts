import { queryClient } from '../api/query-client';
import { bundleBaseUrl, fetchJson } from '../api/http';
import { bootText } from '../i18n/boot-messages';
import { resolveAppLocale } from '../lib/app-locale';
import { parseLocationQuery } from '../lib/location-query';
import { resolveBundleId } from '../lib/bundle';
import { getEmiRendererClient } from '../../adapters/emi-renderer/client';
import { getActiveTheme } from '../lib/theme';
import { loadItemsCatalog } from '../../features/item-list/model/queries';
import { loadItemsLangPayload } from '../../features/item-list/model/items-lang';
import { loadCategoriesManifest } from '../../features/item-detail/model/categories';
import { siteUrl } from '../lib/site-base';
import { warmBundleById } from './warm-bundle';

interface BundlesManifest {
  default?: string;
  bundles?: string[];
}

export async function runAppBoot(onStatus: (message: string) => void) {
  const route = parseLocationQuery(window.location.search);
  const locale = resolveAppLocale();

  onStatus(bootText(locale, 'bootReadingConfig'));
  await fetchJson(siteUrl('language.json'), null);
  const manifest = await fetchJson<BundlesManifest>(siteUrl('bundles.json'), {
    default: undefined,
    bundles: [],
  });

  const bundleId = resolveBundleId(route.bundleToken, manifest.default);
  if (bundleId) {
    await warmBundleById(bundleId, locale, onStatus);
  }

  onStatus(bootText(locale, 'bootLoadingItemsIndex'));
  if (bundleId) {
    await queryClient.prefetchQuery({
      queryKey: ['bundles-manifest'],
      queryFn: () => Promise.resolve(manifest),
    });
    const items = await queryClient.fetchQuery({
      queryKey: ['items-catalog', bundleId],
      queryFn: () => loadItemsCatalog(bundleId),
    });
    await queryClient.prefetchQuery({
      queryKey: ['categories-manifest', bundleId],
      queryFn: () => loadCategoriesManifest(bundleId),
    });

    await queryClient.prefetchQuery({
      queryKey: ['items-lang', bundleId, locale],
      queryFn: () => loadItemsLangPayload(bundleId, locale, items),
    });
  }

  onStatus(bootText(locale, 'bootApplyingIconStyles'));
  if (bundleId) {
    const langPayload = queryClient.getQueryData<Awaited<ReturnType<typeof loadItemsLangPayload>>>([
      'items-lang',
      bundleId,
      locale,
    ]);
    await getEmiRendererClient().configure({
      baseUrl: bundleBaseUrl(bundleId),
      locale,
      theme: getActiveTheme(),
      registryLabels: langPayload?.labels,
    });
  }
}
