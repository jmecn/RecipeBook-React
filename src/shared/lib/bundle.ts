export function resolveBundleId(bundleToken: string, defaultBundle?: string) {
  if (bundleToken && bundleToken !== '_') return bundleToken;
  if (defaultBundle && defaultBundle.trim()) return defaultBundle.trim();
  return '';
}

export function recipePathCandidates(recipeId: string): string[] {
  const idx = recipeId.indexOf(':');
  if (idx <= 0 || idx >= recipeId.length - 1) return [];
  const namespace = recipeId.slice(0, idx);
  const path = recipeId.slice(idx + 1);
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return [
    `recipes/${namespace}/${normalized.replace(/\//g, '_')}.json`,
    `recipes/${namespace}/${path.replace(/\//g, '_')}.json`,
  ];
}
