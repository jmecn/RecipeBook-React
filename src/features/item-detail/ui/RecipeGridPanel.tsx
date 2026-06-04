import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import type { CategoryRecipeLayout } from '../lib/category-recipe-layout';
import { FALLBACK_CATEGORY_LAYOUT } from '../lib/category-recipe-layout';
import type { RecipeIdCopyLabels } from '../../../shared/ui/recipe-id-copy';
import { clearRecipeGridDom, patchRecipeGridDom, type RecipeCardOptions } from '../lib/recipe-grid-dom';
import { getRecipeGridColumnCountFromLayout } from '../../../shared/lib/grid-rows';
import {
  computeRecipeVirtualWindow,
  offsetTopInScrollParent,
  syncRecipeGridSpacers,
} from '../../../shared/lib/recipe-virtual-window';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';

interface RecipeGridPanelProps {
  recipeIds: string[];
  panelKey: 'recipes' | 'uses';
  scrollRoot: HTMLElement | null;
  enabled: boolean;
  onRecipeIdClick?: (recipeId: string) => void;
  copyRecipeIdLabels?: RecipeIdCopyLabels;
}

export function RecipeGridPanel({
  recipeIds,
  panelKey,
  scrollRoot,
  enabled,
  onRecipeIdClick,
  copyRecipeIdLabels,
}: RecipeGridPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topSpacerRef = useRef<HTMLDivElement | null>(null);
  const bottomSpacerRef = useRef<HTMLDivElement | null>(null);
  const cardPoolRef = useRef(new Map<string, HTMLElement>());
  const layoutRef = useRef<CategoryRecipeLayout>(FALLBACK_CATEGORY_LAYOUT);
  const mountSessionRef = useRef<{ disconnect(): void } | null>(null);

  const client = useMemo(() => getEmiRendererClient(), []);
  const { width: mainWidth } = useViewerMain();
  const [containerWidth, setContainerWidth] = useState(0);
  const [layoutReady, setLayoutReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const recipeCardOptions = useMemo<RecipeCardOptions | undefined>(() => {
    if (!onRecipeIdClick && !copyRecipeIdLabels) return undefined;
    return {
      onIdClick: onRecipeIdClick,
      copyLabels: copyRecipeIdLabels,
    };
  }, [copyRecipeIdLabels, onRecipeIdClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !recipeIds.length) {
      layoutRef.current = FALLBACK_CATEGORY_LAYOUT;
      setLayoutReady(false);
      return;
    }

    let cancelled = false;
    setLayoutReady(false);
    void client.probeCategoryRecipeLayout(recipeIds).then((layout) => {
      if (cancelled) return;
      layoutRef.current = layout;
      setLayoutReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [client, enabled, recipeIds]);

  const applyWindow = useCallback(() => {
    const container = containerRef.current;
    const topSpacer = topSpacerRef.current;
    const bottomSpacer = bottomSpacerRef.current;
    if (!container || !topSpacer || !bottomSpacer || !scrollRoot || !enabled || !recipeIds.length) {
      return;
    }

    const layout = layoutRef.current;
    const columnCount = getRecipeGridColumnCountFromLayout(
      containerWidth,
      mainWidth,
      layout.cardOuterWidth,
    );
    const containerTop = offsetTopInScrollParent(container, scrollRoot);

    const win = computeRecipeVirtualWindow({
      recipeIds,
      scrollEl: scrollRoot,
      containerTop,
      rowHeight: layout.rowStride,
      columnCount,
    });
    if (!win) return;

    const needsMountIds = patchRecipeGridDom({
      container,
      topSpacer,
      bottomSpacer,
      windowIds: win.windowIds,
      cardPool: cardPoolRef.current,
      layout,
      recipeCardOptions,
    });

    syncRecipeGridSpacers({
      container,
      topSpacer,
      bottomSpacer,
      startRow: win.startRow,
      endRow: win.endRow,
      totalRows: win.totalRows,
      rowStride: layout.rowStride,
    });

    if (needsMountIds.length > 0) {
      setLoading(true);
      mountSessionRef.current?.disconnect();
      mountSessionRef.current = client.mountRecipeGrid(container, panelKey, scrollRoot);
      window.setTimeout(() => setLoading(false), 0);
    } else {
      setLoading(false);
    }
  }, [client, containerWidth, enabled, mainWidth, panelKey, recipeCardOptions, recipeIds, scrollRoot]);

  const recipeIdsKey = useMemo(() => recipeIds.join('\u0001'), [recipeIds]);

  useEffect(() => {
    if (!layoutReady) return;
    applyWindow();
  }, [applyWindow, layoutReady, recipeIdsKey]);

  useEffect(() => {
    if (!scrollRoot || !enabled || !layoutReady) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyWindow());
    };
    scrollRoot.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      scrollRoot.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [applyWindow, enabled, layoutReady, scrollRoot]);

  useEffect(() => () => {
    mountSessionRef.current?.disconnect();
    mountSessionRef.current = null;
    const container = containerRef.current;
    if (container) {
      container.style.minHeight = '';
      clearRecipeGridDom(container, cardPoolRef.current);
    }
  }, []);

  if (!recipeIds.length) return null;

  return (
    <div
      ref={containerRef}
      className={`recipe-grid recipe-grid-compact${loading ? ' is-loading' : ''}`}
    >
      <div
        ref={topSpacerRef}
        className="virtual-spacer"
        data-virtual-spacer="top"
        aria-hidden="true"
      />
      <div
        ref={bottomSpacerRef}
        className="virtual-spacer"
        data-virtual-spacer="bottom"
        aria-hidden="true"
      />
    </div>
  );
}
