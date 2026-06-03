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
    idToHay.set(row.id, String(row.haystack).toLowerCase());
  }
  return itemIds.map((id) => ({
    id,
    haystack: idToHay.get(id) ?? id.toLowerCase(),
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

export function filterItemIds(
  itemIds: string[],
  query: string,
  searchRows: ItemSearchRow[] | null,
) {
  const q = normalizedFilterQuery(query);
  if (!q) return itemIds;
  if (searchRows && searchRows.length === itemIds.length) {
    const out: string[] = [];
    for (let i = 0; i < searchRows.length; i += 1) {
      if (searchRows[i].haystack.includes(q)) out.push(searchRows[i].id);
    }
    return out;
  }
  return itemIds.filter((id) => id.toLowerCase().includes(q));
}
