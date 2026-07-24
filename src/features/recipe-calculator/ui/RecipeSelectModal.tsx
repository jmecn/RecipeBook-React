import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../shared/i18n/useI18n';
import { applyMinecraftFormattedClasses, hasMinecraftFormatting } from '../../../shared/lib/minecraft-text';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';
import { ScrollableTabBar } from '../../../shared/ui/ScrollableTabBar';
import { useItemOutputs, useRecipeMetasByIds } from '../model/queries';
import { createRecipeCardElement } from '../../item-detail/lib/recipe-grid-dom';
import { getEmiRendererClient, type IconMountSession } from '../../../adapters/emi-renderer/client';
import type { CategoriesManifest } from '../../item-detail/lib/recipe-meta';

const EXCLUDED_CATEGORIES = new Set(['create:automatic_shaped']);

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

interface RecipeSelectModalProps {
  isOpen: boolean;
  selectingFor: string;
  bundleId: string;
  baseUrl: string;
  locale: string;
  langLabels: Record<string, string>;
  manifest: CategoriesManifest | null;
  onSelect: (recipeId: string) => void;
  onClose: () => void;
}

function ModalCategoryTab({
  categoryId,
  active,
  manifest,
  baseUrl,
  locale,
  count,
  onSelect,
}: {
  categoryId: string;
  active: boolean;
  manifest: CategoriesManifest | null;
  baseUrl: string;
  locale: string;
  count: number;
  onSelect: (id: string) => void;
}) {
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const [label, setLabel] = useState(() => {
    const tail = categoryId.includes(':') ? categoryId.split(':')[1] : categoryId;
    return tail.replace(/_/g, ' ');
  });

  useEffect(() => {
    let cancelled = false;
    void client.getCategoryLabel(categoryId, manifest, { baseUrl, locale }).then((text) => {
      if (!cancelled && text) setLabel(text);
    });
    return () => { cancelled = true; };
  }, [categoryId, client, manifest, baseUrl, locale]);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    if (hasMinecraftFormatting(label)) {
      applyMinecraftFormattedClasses(el, label);
    } else {
      el.textContent = label;
    }
  }, [label]);

  useEffect(() => {
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountCategoryIcon(host, {
      categoryId,
      baseUrl,
      locale,
      iconCellSize: manifest?.iconCellSize,
    });
    return () => session.disconnect();
  }, [baseUrl, categoryId, client, locale, manifest?.iconCellSize]);

  return (
    <button
      type="button"
      className={`modal-tab calc-recipe-tab${active ? ' modal-tab-active' : ''}`}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(categoryId)}
    >
      <span className="calc-recipe-tab-icon" ref={iconRef} />
      <span className="calc-recipe-tab-label" ref={labelRef} />
      <span className="calc-recipe-tab-count">({count})</span>
    </button>
  );
}

export function RecipeSelectModal({
  isOpen,
  selectingFor,
  bundleId,
  baseUrl,
  locale,
  langLabels,
  manifest,
  onSelect,
  onClose,
}: RecipeSelectModalProps) {
  const { t } = useI18n();
  const client = useMemo(() => getEmiRendererClient(), []);

  const itemOutputsQuery = useItemOutputs(bundleId, selectingFor);
  const isLoadingCategories = itemOutputsQuery.isLoading;

  const categoryMap = useMemo((): Map<string, string[]> => {
    const outputs = itemOutputsQuery.data ?? {};
    const map = new Map<string, string[]>();
    for (const [category, ids] of Object.entries(outputs)) {
      if (EXCLUDED_CATEGORIES.has(category)) continue;
      const validIds = ids.filter((id) => id && typeof id === 'string');
      if (validIds.length > 0) map.set(category, validIds);
    }
    return map;
  }, [itemOutputsQuery.data]);

  const categories = useMemo(
    () => Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b)),
    [categoryMap],
  );

  const [activeCategory, setActiveCategory] = useState(() => {
    return categories.length > 0 ? categories[0] : '';
  });

  useEffect(() => {
    if (categories.length === 0) {
      if (activeCategory !== '') setActiveCategory('');
    } else if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const activeRecipeIds = useMemo(() => {
    return categoryMap.get(activeCategory) ?? [];
  }, [categoryMap, activeCategory]);

  const recipeMetasQuery = useRecipeMetasByIds(bundleId, selectingFor, activeRecipeIds, (loaded, total, bytes) => {
    onProgressRef.current({ loaded, total, bytes });
  });
  const isLoadingRecipes = recipeMetasQuery.isLoading;

  useEffect(() => {
    loadStartRef.current = Date.now();
    setLoadProgress({ loaded: 0, total: activeRecipeIds.length, bytes: 0 });
  }, [activeRecipeIds]);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const mountSessionRef = useRef<IconMountSession | null>(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0, bytes: 0 });
  const loadStartRef = useRef(0);
  const onProgressRef = useRef(setLoadProgress);
  onProgressRef.current = setLoadProgress;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    return recipeMetasQuery.data ?? [];
  }, [recipeMetasQuery.data]);

  useEffect(() => {
    const host = gridRef.current;
    if (!host || !baseUrl) return;

    host.replaceChildren();
    mountSessionRef.current?.disconnect();

    for (const recipe of filtered) {
      const card = createRecipeCardElement(recipe.recipeId, null, { showId: false });
      card.addEventListener('click', () => onSelect(recipe.recipeId));
      card.style.cursor = 'pointer';
      host.appendChild(card);
    }

    mountSessionRef.current = client.mountRecipeGrid(host, 'calc-select', null);

    return () => {
      mountSessionRef.current?.disconnect();
    };
  }, [baseUrl, client, filtered, onSelect]);

  if (!isOpen) return null;

  const itemLabel = langLabels[selectingFor] || selectingFor;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calc-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {t('recipeSelectTitle')}
            <span className="recipe-select-title-sep" />
            <FormattedItemLabel label={itemLabel} className="recipe-select-title-item" />
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {categories.length > 0 && (
          <ScrollableTabBar className="modal-tabs calc-recipe-tabs">
            {categories.map((c) => {
              const count = categoryMap.get(c)?.length ?? 0;
              return (
                <ModalCategoryTab
                  key={c}
                  categoryId={c}
                  active={activeCategory === c}
                  manifest={manifest}
                  baseUrl={baseUrl}
                  locale={locale}
                  count={count}
                  onSelect={() => setActiveCategory(c)}
                />
              );
            })}
          </ScrollableTabBar>
        )}

        <div className="modal-body calc-recipe-body">
          {filtered.length === 0 && !isLoadingCategories && !isLoadingRecipes ? (
            <div className="calc-recipe-empty">{t('recipeSelectNoRecipes')}</div>
          ) : (
            <div ref={gridRef} className="recipe-grid recipe-grid-compact" />
          )}
          {(isLoadingCategories || isLoadingRecipes) && (
            <div className="calc-recipe-loading-overlay">
              <div className="calc-recipe-loading">
                <span className="calc-spinner" />
                {isLoadingRecipes && loadProgress.total > 0 ? (
                  <span>
                    {t('loading')} ({loadProgress.loaded}/{loadProgress.total})
                    {' \u2022 '}
                    {formatBytes(loadProgress.bytes)}
                    {loadProgress.loaded > 0 && (
                      <>
                        {' \u2022 '}
                        {formatSpeed(loadProgress.bytes, loadStartRef.current)}
                      </>
                    )}
                  </span>
                ) : (
                  <span>{t('loading')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
