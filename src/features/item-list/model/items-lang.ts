import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';
import {
  buildItemLabelTable,
  buildItemSearchRows,
  type ItemsLangData,
} from '../../../shared/lib/item-labels';

export interface ItemsLangPayload {
  raw: ItemsLangData | null;
  labels: Record<string, string>;
  searchRows: ReturnType<typeof buildItemSearchRows>;
  hasLangIndex: boolean;
}

export async function loadItemsLangPayload(
  bundleId: string,
  locale: string,
  itemIds: string[],
): Promise<ItemsLangPayload> {
  const url = `${bundleBaseUrl(bundleId)}items-lang/${locale}.json`;
  const data = await fetchJson<ItemsLangData | null>(url, null);
  return {
    raw: data,
    labels: buildItemLabelTable(data),
    searchRows: buildItemSearchRows(itemIds, data),
    hasLangIndex: Boolean(data?.items?.length),
  };
}

export function itemsLangQueryKey(bundleId: string, locale: string, catalogSize: number) {
  return ['items-lang', bundleId, locale, catalogSize] as const;
}

export function useItemsLangQuery(
  bundleId: string,
  locale: string,
  itemIds: string[],
  catalogReady = false,
) {
  const catalogSize = itemIds.length;
  return useQuery({
    queryKey: itemsLangQueryKey(bundleId, locale, catalogSize),
    enabled: Boolean(bundleId && locale && catalogReady),
    queryFn: () => loadItemsLangPayload(bundleId, locale, itemIds),
  });
}
