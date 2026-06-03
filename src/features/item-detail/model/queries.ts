import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';

export interface ItemDetailData {
  schema?: number;
  inputs?: Record<string, string[]>;
  outputs?: Record<string, string[]>;
  tags?: {
    items?: string[];
    blocks?: string[];
    fluids?: string[];
  };
  tagsInBundle?: {
    items?: string[];
    blocks?: string[];
    fluids?: string[];
  };
}

function itemDetailPath(itemId: string) {
  const id = String(itemId || '').trim().toLowerCase();
  const idx = id.indexOf(':');
  if (idx <= 0 || idx >= id.length - 1) return '';
  return `items/${id.slice(0, idx)}/${id.slice(idx + 1)}.json`;
}

export function useItemDetailQuery(bundleId: string, itemId: string) {
  return useQuery({
    queryKey: ['item-detail', bundleId, itemId],
    enabled: Boolean(bundleId && itemId),
    queryFn: async () => {
      const path = itemDetailPath(itemId);
      if (!path) return null;
      const url = `${bundleBaseUrl(bundleId)}${path}`;
      return fetchJson<ItemDetailData | null>(url, null);
    },
  });
}
