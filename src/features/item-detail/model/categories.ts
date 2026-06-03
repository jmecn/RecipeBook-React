import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';
import { parseCategoriesManifest, type CategoriesManifest } from '../lib/recipe-meta';

export async function loadCategoriesManifest(bundleId: string): Promise<CategoriesManifest> {
  const url = `${bundleBaseUrl(bundleId)}categories/index.json`;
  const raw = await fetchJson<unknown>(url, null);
  return parseCategoriesManifest(raw);
}

export function useCategoriesManifestQuery(bundleId: string) {
  return useQuery({
    queryKey: ['categories-manifest', bundleId],
    enabled: Boolean(bundleId),
    queryFn: () => loadCategoriesManifest(bundleId),
  });
}
