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

export function useItemsLangQuery(bundleId: string, locale: string, itemIds: string[]) {
  return useQuery({
    queryKey: ['items-lang', bundleId, locale],
    enabled: Boolean(bundleId && locale),
    queryFn: () => loadItemsLangPayload(bundleId, locale, itemIds),
  });
}
