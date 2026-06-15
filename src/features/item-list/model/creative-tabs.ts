import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';
import { FALLBACK_LOCALE } from '../../../shared/i18n/locale';
import { creativeTabDisplayLabel } from '../lib/creative-tab-label';

export interface CreativeTabEntry {
  id: string;
  order: number;
  nameKey: string;
}

export interface CreativeTabsCatalog {
  iconCellSize: number;
  iconsDir: string;
  tabs: CreativeTabEntry[];
  labels: Record<string, string>;
}

interface CreativeTabsIndexRaw {
  schema?: number;
  iconCellSize?: number;
  iconsDir?: string;
  tabs?: Array<{ id?: string; order?: number; nameKey?: string }>;
}

interface CreativeTabMembersRaw {
  tab?: string;
  items?: string[];
}

function creativeTabMemberPath(tabId: string) {
  const sep = tabId.indexOf(':');
  if (sep <= 0 || sep >= tabId.length - 1) return '';
  return `creative-tabs/${tabId.slice(0, sep)}/${tabId.slice(sep + 1)}.json`;
}

function parseCreativeTabsIndex(
  raw: CreativeTabsIndexRaw | null,
  lang: Record<string, string> | null,
): CreativeTabsCatalog | null {
  if (!raw || !Array.isArray(raw.tabs) || raw.tabs.length === 0) {
    return null;
  }
  const tabs = raw.tabs
    .filter((entry): entry is CreativeTabEntry => Boolean(entry?.id && entry?.nameKey))
    .map((entry) => ({
      id: entry.id!,
      order: Number.isFinite(entry.order) ? (entry.order as number) : 0,
      nameKey: entry.nameKey!,
    }))
    .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id)));
  if (tabs.length === 0) return null;
  return {
    iconCellSize: Number.isFinite(raw.iconCellSize) ? (raw.iconCellSize as number) : 32,
    iconsDir: raw.iconsDir || 'creative-tabs/icons',
    tabs,
    labels: lang ?? {},
  };
}

export function creativeTabLabel(
  catalog: CreativeTabsCatalog | null | undefined,
  tabId: string,
) {
  const entry = catalog?.tabs.find((tab) => tab.id === tabId);
  return creativeTabDisplayLabel(tabId, entry?.nameKey, catalog?.labels);
}

export async function loadCreativeTabsCatalog(
  bundleId: string,
  locale: string,
): Promise<CreativeTabsCatalog | null> {
  const base = bundleBaseUrl(bundleId);
  const index = await fetchJson<CreativeTabsIndexRaw | null>(`${base}creative-tabs/index.json`, null);
  if (!index?.tabs?.length) return null;

  const langCodes = locale === FALLBACK_LOCALE ? [locale] : [locale, FALLBACK_LOCALE];
  let lang: Record<string, string> | null = null;
  for (const code of langCodes) {
    const table = await fetchJson<Record<string, string> | null>(`${base}lang/${code}.json`, null);
    if (table && Object.keys(table).length > 0) {
      lang = table;
      break;
    }
  }
  return parseCreativeTabsIndex(index, lang);
}

export function creativeTabsCatalogQueryKey(bundleId: string, locale: string) {
  return ['creative-tabs-catalog', bundleId, locale] as const;
}

export function useCreativeTabsCatalogQuery(bundleId: string, locale: string) {
  return useQuery({
    queryKey: creativeTabsCatalogQueryKey(bundleId, locale),
    enabled: Boolean(bundleId && locale),
    queryFn: () => loadCreativeTabsCatalog(bundleId, locale),
    staleTime: 5 * 60_000,
  });
}

export function creativeTabMembersQueryKey(bundleId: string, tabId: string | null) {
  return ['creative-tab-members', bundleId, tabId] as const;
}

export async function loadCreativeTabMembers(bundleId: string, tabId: string) {
  const path = creativeTabMemberPath(tabId);
  if (!path) return [];
  const data = await fetchJson<CreativeTabMembersRaw | null>(`${bundleBaseUrl(bundleId)}${path}`, null);
  if (!data?.items?.length) return [];
  return data.items.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function useCreativeTabMembersQuery(bundleId: string, tabId: string | null) {
  return useQuery({
    queryKey: creativeTabMembersQueryKey(bundleId, tabId),
    enabled: Boolean(bundleId && tabId),
    queryFn: () => loadCreativeTabMembers(bundleId, tabId!),
    staleTime: 5 * 60_000,
  });
}
