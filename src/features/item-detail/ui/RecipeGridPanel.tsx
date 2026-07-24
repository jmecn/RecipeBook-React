import { useEffect, useMemo, useRef, useState } from 'react';
import { getEmiRendererClient, type IconMountSession } from '../../../adapters/emi-renderer/client';
import { bundleBaseUrl } from '../../../shared/api/http';
import { recipePathCandidates } from '../../../shared/lib/bundle';
import { FALLBACK_CATEGORY_LAYOUT } from '../lib/category-recipe-layout';
import type { RecipeIdCopyLabels } from '../../../shared/ui/recipe-id-copy';
import { createRecipeCardElement, clearRecipeGridDom } from '../lib/recipe-grid-dom';
import { useI18n } from '../../../shared/i18n/useI18n';

interface RecipeGridPanelProps {
  recipeIds: string[];
  panelKey: 'recipes' | 'uses';
  bundleId: string;
  enabled: boolean;
  onRecipeIdClick?: (recipeId: string) => void;
  copyRecipeIdLabels?: RecipeIdCopyLabels;
}

const CONCURRENCY = 16

const fetchedCache = new Map<string, string>()

function urlFromCandidates(baseUrl: string, candidates: string[]): string | null {
  for (const relPath of candidates) {
    const url = `${baseUrl}${relPath}`
    if (fetchedCache.has(url)) return url
  }
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatSpeed(bytes: number, startMs: number): string {
  const elapsed = (Date.now() - startMs) / 1000
  if (elapsed <= 0) return ''
  const bps = bytes / elapsed
  if (bps < 1024) return `${bps.toFixed(0)} B/s`
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`
}

export function RecipeGridPanel({
  recipeIds,
  panelKey,
  bundleId,
  enabled,
  onRecipeIdClick,
  copyRecipeIdLabels,
}: RecipeGridPanelProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountSessionRef = useRef<IconMountSession | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const loadStartRef = useRef(0);
  const [progress, setProgress] = useState<{ loaded: number; total: number; bytes: number } | null>(null);

  const recipeCardOptions = useMemo(() => {
    if (!onRecipeIdClick && !copyRecipeIdLabels) return undefined;
    return {
      onIdClick: onRecipeIdClick,
      copyLabels: copyRecipeIdLabels,
    };
  }, [copyRecipeIdLabels, onRecipeIdClick]);

  useEffect(() => {
    if (!enabled || !recipeIds.length) {
      mountSessionRef.current?.disconnect();
      mountSessionRef.current = null;
      const host = containerRef.current;
      if (host) clearRecipeGridDom(host, new Map());
      setProgress(null);
      return;
    }

    let cancelled = false;
    const host = containerRef.current;
    if (!host) return;

    clearRecipeGridDom(host, new Map());
    mountSessionRef.current?.disconnect();
    mountSessionRef.current = null;

    const baseUrl = bundleBaseUrl(bundleId);

    async function downloadAll() {
      let loaded = 0;
      let cumBytes = 0;
      const total = recipeIds.length;
      const needFetch: string[] = [];

      for (const recipeId of recipeIds) {
        const candidates = recipePathCandidates(recipeId);
        const cached = urlFromCandidates(baseUrl, candidates);
        if (cached) {
          loaded++;
          cumBytes += new TextEncoder().encode(fetchedCache.get(cached)).length;
        } else {
          needFetch.push(recipeId);
        }
      }

      if (needFetch.length > 0) {
        loadStartRef.current = Date.now();
        setProgress({ loaded, total, bytes: cumBytes });

        const queue = [...needFetch];
        async function worker() {
          while (queue.length > 0) {
            if (cancelled) return;
            const recipeId = queue.shift()!;
            const candidates = recipePathCandidates(recipeId);
            for (const relPath of candidates) {
              const url = `${baseUrl}${relPath}`;
              try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const text = await res.text();
                fetchedCache.set(url, text);
                cumBytes += new TextEncoder().encode(text).length;
              } catch {
                continue;
              }
              break;
            }
            loaded++;
            if (!cancelled) setProgress({ loaded, total, bytes: cumBytes });
          }
        }

        const poolSize = Math.min(CONCURRENCY, needFetch.length);
        const workers = Array.from({ length: poolSize }, () => worker());
        await Promise.all(workers);
      }

      if (cancelled) return;

      const layout = FALLBACK_CATEGORY_LAYOUT;
      for (const recipeId of recipeIds) {
        const card = createRecipeCardElement(recipeId, layout, recipeCardOptions);
        if (onRecipeIdClick) {
          card.addEventListener('click', () => onRecipeIdClick(recipeId));
          card.style.cursor = 'pointer';
        }
        host!.appendChild(card);
      }

      mountSessionRef.current = client.mountRecipeGrid(host!, panelKey, null);
      setProgress(null);
    }

    downloadAll();

    return () => {
      cancelled = true;
      mountSessionRef.current?.disconnect();
      mountSessionRef.current = null;
      if (host) clearRecipeGridDom(host, new Map());
    };
  }, [bundleId, client, enabled, onRecipeIdClick, panelKey, recipeCardOptions, recipeIds]);

  if (!recipeIds.length) return null;

  return (
    <div ref={containerRef} className={`recipe-grid recipe-grid-compact${progress ? ' is-loading' : ''}`}>
      {progress && (
        <div className="calc-recipe-loading-overlay">
          <div className="calc-recipe-loading">
            <span className="calc-spinner" />
            <span>
              {t('loading')} ({progress.loaded}/{progress.total})
              {' \u2022 '}
              {formatBytes(progress.bytes)}
              {progress.loaded > 0 && (
                <>
                  {' \u2022 '}
                  {formatSpeed(progress.bytes, loadStartRef.current)}
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


