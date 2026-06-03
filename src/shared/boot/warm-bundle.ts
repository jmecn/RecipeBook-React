import { bundleBaseUrl, fetchJson } from '../api/http';
import { bootText } from '../i18n/boot-messages';
import { FALLBACK_LOCALE } from '../i18n/messages';

function joinBase(baseUrl: string, rel: string) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${rel.replace(/^\//, '')}`;
}

async function warmFetch(url: string) {
  try {
    await fetch(url);
  } catch {
    // ignore preload failures
  }
}

export async function warmBundleAssets(
  baseUrl: string,
  locale: string,
  onStatus?: (message: string) => void,
) {
  onStatus?.(bootText(locale, 'bootLoadingBundle'));
  await warmFetch(joinBase(baseUrl, 'bundle.json'));

  const activeLocale = locale || FALLBACK_LOCALE;
  const langCodes = new Set([FALLBACK_LOCALE]);
  if (activeLocale !== FALLBACK_LOCALE) langCodes.add(activeLocale);

  onStatus?.(bootText(locale, 'bootLoadingLang'));
  await Promise.all([...langCodes].map((code) => warmFetch(joinBase(baseUrl, `lang/${code}.json`))));

  onStatus?.(bootText(locale, 'bootLoadingIcons'));
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
  await Promise.all([
    warmFetch(joinBase(baseUrl, 'icons/icons.css')),
    warmFetch(joinBase(baseUrl, 'textures/manifest.json')),
    warmFetch(joinBase(baseUrl, 'textures/emi/textures/gui/background.png')),
    warmFetch(joinBase(baseUrl, 'textures/emi/textures/gui/widgets.png')),
  ]);

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
    onStatus?.(bootText(locale, 'bootWarmingAtlas'));
    await Promise.all(preloadUrls.map((url) => warmFetch(url)));
  }

  onStatus?.(bootText(locale, 'bootLoadingSearch'));
  await warmFetch(joinBase(baseUrl, `items-lang/${activeLocale}.json`));
  if (activeLocale !== FALLBACK_LOCALE) {
    await warmFetch(joinBase(baseUrl, `items-lang/${FALLBACK_LOCALE}.json`));
  }

  onStatus?.(bootText(locale, 'bootEntering'));
}

export async function warmBundleById(
  bundleId: string,
  locale: string,
  onStatus?: (message: string) => void,
) {
  if (!bundleId) return;
  await warmBundleAssets(bundleBaseUrl(bundleId), locale, onStatus);
}
