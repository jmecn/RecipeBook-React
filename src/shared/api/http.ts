export function bundleBaseUrl(bundleId: string) {
  const slug = String(bundleId || '').trim().replace(/^\/+|\/+$/g, '');
  return `/bundles/${slug}/`;
}

export async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
