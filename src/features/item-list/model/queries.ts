import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';

interface RawItemsIndex {
  [namespace: string]: string[] | number | undefined;
}

function parseItemsCatalog(raw: RawItemsIndex) {
  const ids = new Set<string>();
  for (const [namespace, paths] of Object.entries(raw)) {
    if (namespace === 'schema' || !Array.isArray(paths)) continue;
    for (const path of paths) {
      if (typeof path !== 'string' || path.length === 0) continue;
      ids.add(path.includes(':') ? path : `${namespace}:${path}`);
    }
  }
  return Array.from(ids).sort();
}

export async function loadItemsCatalog(bundleId: string) {
  const raw = await fetchJson<RawItemsIndex>(`${bundleBaseUrl(bundleId)}items/index.json`, {});
  return parseItemsCatalog(raw);
}

export function useItemsCatalogQuery(bundleId: string) {
  return useQuery({
    queryKey: ['items-catalog', bundleId],
    enabled: Boolean(bundleId && bundleId.trim()),
    queryFn: () => loadItemsCatalog(bundleId),
  });
}
