export const EMBED_NAVIGATE_EVENT = 'navigate';
export const EMBED_RESIZE_EVENT = 'resize';
const EMBED_SOURCE = 'recipe-book-embed';

export interface EmbedContext {
  enabled: boolean;
  frameId: string | null;
}

export function parseEmbedContext(search: string): EmbedContext {
  const params = new URLSearchParams(search);
  const raw = params.get('embed');
  const enabled = raw === '1' || raw === 'true' || raw === 'yes';
  const frame = params.get('frame');
  return {
    enabled,
    frameId: frame && frame.trim() ? frame.trim() : null,
  };
}

export function buildTopLevelRecipeBookHref(appUrl: string): string {
  const basePath = window.location.pathname.replace(/\/+$/, '');
  return `${window.location.origin}${basePath}${appUrl}`;
}

function resolveParentOrigin(): string {
  try {
    const raw = new URLSearchParams(window.location.search).get('parentOrigin')?.trim();
    if (!raw) {
      return window.location.origin;
    }
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return window.location.origin;
  }
}

export function notifyEmbedNavigate(href: string, frameId: string | null = null): void {
  const payload = {
    source: EMBED_SOURCE,
    type: EMBED_NAVIGATE_EVENT,
    href,
    frameId,
  };
  const targetOrigin = resolveParentOrigin();
  const isFramed = window.parent !== window;
  if (isFramed) {
    window.parent.postMessage(payload, targetOrigin);
    return;
  }
  window.location.assign(href);
}

export function notifyEmbedHeight(height: number, frameId: string | null): void {
  if (window.parent === window) {
    return;
  }
  const rounded = Math.max(200, Math.ceil(height));
  window.parent.postMessage(
    {
      source: EMBED_SOURCE,
      type: EMBED_RESIZE_EVENT,
      height: rounded,
      frameId,
    },
    resolveParentOrigin(),
  );
}
