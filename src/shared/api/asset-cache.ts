export const ASSET_CACHE = 'tfg-recipe-viewer-v1';

export async function fetchWithAssetCache(
  url: string,
): Promise<{ response: Response; fromCache: boolean }> {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(ASSET_CACHE);
      const hit = await cache.match(url);
      if (hit) return { response: hit, fromCache: true };
      const response = await fetch(url);
      if (response.ok) await cache.put(url, response.clone());
      return { response, fromCache: false };
    } catch {
      /* fall through */
    }
  }
  const response = await fetch(url);
  return { response, fromCache: false };
}

export async function warmFetch(url: string): Promise<boolean> {
  try {
    const { response, fromCache } = await fetchWithAssetCache(url);
    if (!response.ok) return fromCache;
    try {
      await response.arrayBuffer();
    } catch {
      /* ignore */
    }
    return fromCache;
  } catch {
    return false;
  }
}
