import { canonicalItemId, normalizedFilterQuery } from './canonical-item-id';

export interface ItemsLangRow {
  id: string;
  label?: string;
  haystack?: string;
}

export interface ItemsLangData {
  items?: ItemsLangRow[];
}

export interface ItemSearchRow {
  id: string;
  haystack: string;
}

export function buildItemLabelTable(data: ItemsLangData | null | undefined) {
  const labels: Record<string, string> = {};
  if (!data?.items?.length) return labels;
  for (const row of data.items) {
    if (!row?.id || row.label == null) continue;
    labels[canonicalItemId(row.id)] = String(row.label);
  }
  return labels;
}

export function buildItemSearchRows(
  itemIds: string[],
  data: ItemsLangData | null | undefined,
): ItemSearchRow[] | null {
  if (!data?.items?.length || !itemIds.length) return null;
  const idToHay = new Map<string, string>();
  for (const row of data.items) {
    if (!row?.id || row.haystack == null) continue;
    const haystack = String(row.haystack).toLowerCase();
    idToHay.set(canonicalItemId(row.id), haystack);
    idToHay.set(row.id, haystack);
  }
  return itemIds.map((id) => ({
    id,
    haystack: idToHay.get(canonicalItemId(id)) ?? idToHay.get(id) ?? id.toLowerCase(),
  }));
}

export function lookupItemLabel(
  labels: Record<string, string> | null | undefined,
  itemId: string,
) {
  const bare = canonicalItemId(itemId);
  const label = labels?.[bare];
  return label != null && label !== '' ? label : bare;
}

function itemHaystack(
  id: string,
  hayById: Map<string, string>,
  labels: Record<string, string> | null | undefined,
): string {
  const bare = canonicalItemId(id);
  const fromIndex = hayById.get(bare) ?? hayById.get(id);
  if (fromIndex) return fromIndex;
  const label = labels?.[bare];
  if (label) return `${bare.toLowerCase()} ${label.toLowerCase()}`;
  return bare.toLowerCase();
}

export function filterItemIds(
  itemIds: string[],
  query: string,
  searchRows: ItemSearchRow[] | null,
  labels?: Record<string, string> | null,
) {
  const q = normalizedFilterQuery(query);
  if (!q) return itemIds;

  const hayById = new Map<string, string>();
  if (searchRows?.length) {
    for (const row of searchRows) {
      hayById.set(canonicalItemId(row.id), row.haystack);
      hayById.set(row.id, row.haystack);
    }
  }

  return itemIds.filter((id) => itemHaystack(id, hayById, labels).includes(q));
}
