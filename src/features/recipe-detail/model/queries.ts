import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';

function recipePathCandidates(recipeId: string) {
  const value = String(recipeId || '').trim();
  const sep = value.indexOf(':');
  if (sep <= 0 || sep >= value.length - 1) return [];
  const namespace = value.slice(0, sep);
  const path = value.slice(sep + 1);
  const normalized = path.replace(/\\/g, '/');
  const noLead = normalized.replace(/^\/+/, '');
  return [
    `recipes/${namespace}/${normalized.replace(/\//g, '_')}.json`,
    `recipes/${namespace}/${noLead.replace(/\//g, '_')}.json`,
    `recipes/${namespace}/${normalized.replace(/[:/]/g, '_')}.json`,
  ];
}

export function useRecipeDetailQuery(bundleId: string, recipeId: string) {
  return useQuery({
    queryKey: ['recipe-detail', bundleId, recipeId],
    enabled: Boolean(bundleId && recipeId),
    queryFn: async () => {
      for (const relPath of recipePathCandidates(recipeId)) {
        const url = `${bundleBaseUrl(bundleId)}${relPath}`;
        const data = await fetchJson<Record<string, unknown> | null>(url, null);
        if (data) return { path: relPath, data };
      }
      return null;
    },
  });
}
