import { bundleBaseUrl, fetchJson } from '../api/http';
import { warmFetch } from '../api/asset-cache';
import i18n from '../i18n/i18n';
import { FALLBACK_LOCALE } from '../i18n/locale';

function joinBase(baseUrl: string, rel: string) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${rel.replace(/^\//, '')}`;
}

export async function warmBundleAssets(
  baseUrl: string,
  locale: string,
  onStatus?: (message: string) => void,
) {
  let usedCache = false;

  onStatus?.(i18n.t('boot.loadingBundle'));
  if (await warmFetch(joinBase(baseUrl, 'bundle.json'))) usedCache = true;

  const activeLocale = locale || FALLBACK_LOCALE;
  const langCodes = new Set([FALLBACK_LOCALE]);
  if (activeLocale !== FALLBACK_LOCALE) langCodes.add(activeLocale);

  onStatus?.(i18n.t('boot.loadingLang'));
  for (const code of langCodes) {
    if (await warmFetch(joinBase(baseUrl, `lang/${code}.json`))) usedCache = true;
  }

  onStatus?.(i18n.t('boot.loadingIcons'));
  type IconIndex = {
    pages?: Array<{
      preload?: boolean;
      file?: string;
      src?: string;
      sources?: Array<{ file?: string; src?: string }>;
    }>;
  };
  const index = await fetchJson<IconIndex | null>(
    joinBase(baseUrl, 'icons/index.json'),
    null,
  );
  const iconWarm = await Promise.all([
    warmFetch(joinBase(baseUrl, 'icons/icons.css')),
    warmFetch(joinBase(baseUrl, 'textures/manifest.json')),
    warmFetch(joinBase(baseUrl, 'textures/emi/textures/gui/background.png')),
    warmFetch(joinBase(baseUrl, 'textures/emi/textures/gui/widgets.png')),
  ]);
  if (iconWarm.some(Boolean)) usedCache = true;

  const preloadUrls: string[] = [];
  const pages = Array.isArray(index?.pages) ? index.pages : [];
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    const sources = Array.isArray(page?.sources) && page.sources.length
      ? page.sources
      : (page?.file || page?.src ? [{ file: page.file || page.src }] : []);
    const file = sources[0]?.file || sources[0]?.src;
    if (!file) continue;
    if (page?.preload === true || i === 0) {
      preloadUrls.push(joinBase(baseUrl, `icons/${file}`));
    }
  }

  if (preloadUrls.length > 0) {
    onStatus?.(i18n.t('boot.warmingAtlas'));
    const atlasWarm = await Promise.all(preloadUrls.map((url) => warmFetch(url)));
    if (atlasWarm.some(Boolean)) usedCache = true;
  }

  onStatus?.(i18n.t('boot.loadingSearch'));
  if (await warmFetch(joinBase(baseUrl, `items-lang/${activeLocale}.json`))) usedCache = true;
  if (activeLocale !== FALLBACK_LOCALE) {
    if (await warmFetch(joinBase(baseUrl, `items-lang/${FALLBACK_LOCALE}.json`))) usedCache = true;
  }

  onStatus?.(i18n.t('boot.entering', {
    cachedHint: usedCache ? i18n.t('boot.cacheHint') : '',
  }));
}

export async function warmBundleById(
  bundleId: string,
  locale: string,
  onStatus?: (message: string) => void,
) {
  if (!bundleId) return;
  await warmBundleAssets(bundleBaseUrl(bundleId), locale, onStatus);
}
