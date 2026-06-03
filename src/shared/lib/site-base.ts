export function siteBase(): string {
  let path = window.location.pathname.replace(/\/index\.html$/i, '');
  if (path === '' || path === '/') return '/';
  if (!path.endsWith('/')) path += '/';
  return path;
}

export function siteUrl(relative: string): string {
  const rel = String(relative).replace(/^\//, '');
  const base = siteBase();
  if (base === '/') return `/${rel}`;
  return `${base}${rel}`;
}

export function routerBasename(): string {
  const base = siteBase();
  if (base === '/') return '/';
  return base.replace(/\/$/, '');
}

export function normalizeSitePath(): void {
  const base = siteBase();
  const path = window.location.pathname.replace(/\/index\.html$/i, '');
  const baseNoSlash = base === '/' ? '/' : base.slice(0, -1);
  if (path === baseNoSlash) {
    const next = base + window.location.search + window.location.hash;
    window.history.replaceState({}, '', next);
  }
}
