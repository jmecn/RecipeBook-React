const loadedStylesheets = new Set<string>();

export function creativeTabIconsStylesheetUrl(baseUrl: string, iconsDir: string) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const dir = iconsDir.replace(/^\/+|\/+$/g, '');
  return `${base}${dir}/creative-tab-icons.css`;
}

export function ensureCreativeTabIconStylesheet(baseUrl: string, iconsDir: string): Promise<void> {
  const href = creativeTabIconsStylesheetUrl(baseUrl, iconsDir);
  if (loadedStylesheets.has(href)) return Promise.resolve();
  if (typeof document === 'undefined') return Promise.resolve();

  const existing = document.querySelector(`link[data-creative-tab-icons="${href}"]`);
  if (existing) {
    loadedStylesheets.add(href);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.creativeTabIcons = href;
    link.onload = () => {
      loadedStylesheets.add(href);
      resolve();
    };
    link.onerror = () => reject(new Error(`failed to load ${href}`));
    document.head.appendChild(link);
  });
}

export function createCreativeTabIconElement(tabId: string) {
  const span = document.createElement('span');
  span.className = 'creative-tab-icon-atlas';
  span.dataset.item = tabId;
  span.setAttribute('aria-hidden', 'true');
  return span;
}
