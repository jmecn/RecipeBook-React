'use strict';

const CACHE_PREFIX = 'recipe-book-react-';
const PENDING_CACHE = `${CACHE_PREFIX}pending`;
const CONTENT_HASH_TTL_MS = 24 * 60 * 60 * 1000;
const META_KEY = '/__recipe-book-content-hash-meta__';
const BUNDLE_ASSET_PATTERN = /\/bundles\/[^/]+\//;

let activeContentHash = null;
let lastContentHashSync = 0;
let contentHashInflight = null;

function isBundleAssetUrl(url) {
  return BUNDLE_ASSET_PATTERN.test(url.pathname);
}

function buildJsonUrl() {
  return new URL('build.json', self.registration.scope).href;
}

function cacheNameForContentHash(contentHash) {
  const safe = String(contentHash || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${CACHE_PREFIX}${safe}`;
}

function rememberContentHashFromCacheName(cacheName) {
  if (!cacheName.startsWith(CACHE_PREFIX) || cacheName === PENDING_CACHE) return;
  const hash = cacheName.slice(CACHE_PREFIX.length);
  if (hash && hash !== 'unknown') activeContentHash = hash;
}

function isContentHashStale() {
  return Date.now() - lastContentHashSync >= CONTENT_HASH_TTL_MS;
}

async function loadContentHashMeta() {
  try {
    const cache = await caches.open(PENDING_CACHE);
    const response = await cache.match(META_KEY);
    if (!response) return null;
    return await response.json();
  } catch (error) {
    console.log('[sw] loadContentHashMeta failed', error);
    return null;
  }
}

async function saveContentHashMeta(meta) {
  try {
    const cache = await caches.open(PENDING_CACHE);
    await cache.put(
      META_KEY,
      new Response(JSON.stringify(meta), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  } catch (error) {
    console.log('[sw] saveContentHashMeta failed', error);
  }
}

async function initContentHashState() {
  const meta = await loadContentHashMeta();
  if (meta && typeof meta.contentHash === 'string' && meta.contentHash) {
    activeContentHash = meta.contentHash;
    lastContentHashSync = Number(meta.syncedAt) || 0;
  }
}

function isRecipeCacheName(key) {
  return key.startsWith('tfg-recipe-cache-') || key.startsWith(CACHE_PREFIX);
}

async function purgeOldCaches(keepName) {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => isRecipeCacheName(key) && key !== keepName && key !== PENDING_CACHE)
      .map((key) => caches.delete(key)),
  );
}

async function readContentHash(response) {
  try {
    const build = await response.clone().json();
    return build.contentHash || null;
  } catch (error) {
    console.log('[sw] readContentHash failed', error);
    return null;
  }
}

async function fetchContentHash({ forceNetwork = false } = {}) {
  if (!forceNetwork && contentHashInflight) return contentHashInflight;

  contentHashInflight = (async () => {
    try {
      const response = await fetch(buildJsonUrl(), {
        cache: forceNetwork ? 'no-store' : 'default',
      });
      if (!response.ok) return null;
      const hash = await readContentHash(response);
      if (hash) {
        activeContentHash = hash;
        lastContentHashSync = Date.now();
        void saveContentHashMeta({
          contentHash: hash,
          syncedAt: lastContentHashSync,
        });
      }
      return hash;
    } catch (error) {
      console.log('[sw] fetchContentHash failed', error);
      return null;
    } finally {
      contentHashInflight = null;
    }
  })();

  return contentHashInflight;
}

async function syncCacheFromBuildJson({ forceNetwork = false } = {}) {
  const hash = await fetchContentHash({ forceNetwork });
  if (!hash) return PENDING_CACHE;

  const cacheName = cacheNameForContentHash(hash);
  await purgeOldCaches(cacheName);
  return cacheName;
}

async function getLastKnownCacheName() {
  const keys = await caches.keys();
  const named = keys.filter(
    (key) => key.startsWith(CACHE_PREFIX) && key !== PENDING_CACHE,
  );
  if (named.length === 0) return PENDING_CACHE;
  named.sort();
  rememberContentHashFromCacheName(named[named.length - 1]);
  return named[named.length - 1];
}

async function resolveActiveCacheName() {
  if (activeContentHash && !isContentHashStale()) {
    return cacheNameForContentHash(activeContentHash);
  }

  const cacheName = await syncCacheFromBuildJson({ forceNetwork: true });
  if (cacheName !== PENDING_CACHE) return cacheName;

  const fallback = await getLastKnownCacheName();
  if (fallback !== PENDING_CACHE) return fallback;

  return PENDING_CACHE;
}

async function handleBundleAssetFetch(request) {
  const cacheName = await resolveActiveCacheName();
  if (cacheName === PENDING_CACHE) return fetch(request);

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const revalidate = fetch(request, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return response;
      const targetCache = await caches.open(cacheName);
      await targetCache.put(request, response.clone());
      return response;
    })
    .catch((error) => {
      console.log('[sw] revalidate failed', error);
      return null;
    });

  if (cached) {
    void revalidate;
    return cached;
  }

  const network = await revalidate;
  if (network) return network;
  return new Response('Bundle asset unavailable', { status: 504 });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await caches.open(PENDING_CACHE);
      await initContentHashState();
      await syncCacheFromBuildJson({ forceNetwork: true });
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!isBundleAssetUrl(url)) return;

  event.respondWith(handleBundleAssetFetch(event.request));
});
