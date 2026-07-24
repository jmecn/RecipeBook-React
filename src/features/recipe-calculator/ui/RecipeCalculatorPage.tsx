import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/useI18n';
import { useAppRoute } from '../../../shared/hooks/useAppRoute';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { bundleBaseUrl } from '../../../shared/api/http';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useCategoriesManifestQuery } from '../../item-detail/model/categories';
import { filterItemIds } from '../../../shared/lib/item-labels';
import { mergeAmounts, deduplicateMaterials } from '../lib/calculator-engine';
import type { CalcMaterial, CalculatorState } from '../model/types';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { encodeCalcState } from '../../../shared/lib/calc-base64';
import { buildNavUrl } from '../../../shared/lib/location-query';
import { MaterialSummary } from './MaterialSummary';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import { RecipeSelectModal } from './RecipeSelectModal';
import { CalcTargetTree, type CalcTargetSummary } from './CalcTargetTree';
import { FavoritesDrawer } from '../../favorites/ui/FavoritesDrawer';
import { useFavorites } from '../../favorites/hooks/useFavorites';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';
import { MaterialIcon } from './MaterialIcon';

export function RecipeCalculatorPage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const route = useAppRoute();
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';

  const {
    state,
    addTarget,
    removeTarget,
    setTargetAmount,
    setSelection,
    importState,
    tagItemSelections,
    tagFluidSelections,
    setTagItemSelection,
  } = useCalculatorState();
  const { targets, selections } = state;

  const [selectingFor, setSelectingFor] = useState<string | null>(null);
  const [inputItem, setInputItem] = useState('');
  const [searchLimit, setSearchLimit] = useState(20);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [targetSummaries, setTargetSummaries] = useState<Map<number, CalcTargetSummary>>(new Map());

  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = useMemo<string[]>(
    () => Array.isArray(itemsQuery.data) ? itemsQuery.data : [],
    [itemsQuery.data],
  );
  const langQuery = useItemsLangQuery(bundleId, locale, items, itemsQuery.isSuccess);
  const langLabels = useMemo<Record<string, string>>(
    () => langQuery.data?.labels ?? {},
    [langQuery.data?.labels],
  );
  const categoriesQuery = useCategoriesManifestQuery(bundleId);
  const manifest = categoriesQuery.data ?? null;

  const { favorites, addItem, removeItem, isFavorite } = useFavorites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFavItems, setSelectedFavItems] = useState<Array<{ itemId: string; amount: number }>>([]);

  const { rawMaterials, byproducts, catalysts } = useMemo(() => {
    const allRaw: CalcMaterial[] = [];
    const allByproducts: CalcMaterial[] = [];
    const allCatalysts: CalcMaterial[] = [];
    targetSummaries.forEach(s => {
      allRaw.push(...s.rawMaterials);
      allByproducts.push(...s.byproducts);
      allCatalysts.push(...s.catalysts);
    });
    return {
      rawMaterials: mergeAmounts(allRaw),
      byproducts: mergeAmounts(allByproducts),
      catalysts: deduplicateMaterials(allCatalysts),
    };
  }, [targetSummaries]);

  useEffect(() => {
    setTargetSummaries(prev => {
      let changed = false
      for (const key of prev.keys()) {
        if (key >= targets.length) {
          if (!changed) prev = new Map(prev)
          prev.delete(key)
          changed = true
        }
      }
      return prev
    })
  }, [targets])

  const handleSelectRecipe = useCallback((materialId: string) => {
    setSelectingFor(materialId);
  }, []);

  const handleRecipeSelected = useCallback((recipeId: string) => {
    if (selectingFor) {
      setSelection(selectingFor, recipeId);
    }
    setSelectingFor(null);
  }, [selectingFor, setSelection]);

  const handleClearSelection = useCallback((materialId: string) => {
    setSelection(materialId, null);
  }, [setSelection]);

  const handleSelectTag = useCallback(async (tagId: string, anchorEl: HTMLElement) => {
    const client = getEmiRendererClient();
    await client.showTagPopover(tagId, anchorEl, (itemId: string) => {
      setTagItemSelection(tagId, itemId);
    });
  }, [setTagItemSelection]);

  const handleClearTagSelection = useCallback((tagId: string) => {
    setTagItemSelection(tagId, null);
  }, [setTagItemSelection]);

  const handleImport = useCallback((result: { state: CalculatorState; tagItemSelections: Record<string, string>; tagFluidSelections: Record<string, string> }) => {
    importState(result.state);
    for (const [k, v] of Object.entries(result.tagItemSelections)) {
      setTagItemSelection(k, v)
    }
    setTargetSummaries(new Map());
  }, [importState, setTagItemSelection]);

  const handleAddTargetFromSearch = useCallback((itemId: string) => {
    addTarget(itemId, 1);
    setInputItem('');
  }, [addTarget]);

  const handleSummaryReady = useCallback((index: number, summary: CalcTargetSummary) => {
    setTargetSummaries(prev => {
      const existing = prev.get(index);
      if (existing === summary) return prev;
      const next = new Map(prev);
      next.set(index, summary);
      return next;
    });
  }, []);

  const handleToggleFavorite = useCallback((favId: string) => {
    if (isFavorite(favId)) removeItem(favId)
    else addItem(favId)
  }, [isFavorite, addItem, removeItem])

  const handleFavCalculate = useCallback((items: Array<{ itemId: string; amount: number }>) => {
    const encoded = encodeCalcState({ targets: items, selections: {} })
    navigate(buildNavUrl(route, { view: 'calculator', calc: encoded }), { replace: true })
  }, [navigate, route])

  const handleFavAddTarget = useCallback((favId: string, amount: number) => {
    setSelectedFavItems(prev => {
      const exists = prev.some(i => i.itemId === favId)
      if (exists) return prev.map(i => i.itemId === favId ? { ...i, amount } : i)
      return [...prev, { itemId: favId, amount }]
    })
  }, [])

  const handleFavRemoveTarget = useCallback((favId: string) => {
    setSelectedFavItems(prev => prev.filter(i => i.itemId !== favId))
  }, [])

  const allFiltered = useMemo(() => {
    if (!inputItem.trim()) return [];
    return filterItemIds(items, inputItem, langQuery.data?.searchRows ?? null, langLabels);
  }, [inputItem, items, langQuery.data?.searchRows, langLabels]);

  const filteredItems = useMemo(() => {
    return allFiltered.slice(0, searchLimit);
  }, [allFiltered, searchLimit]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || allFiltered.length <= filteredItems.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSearchLimit(prev => prev + 20);
        observer.unobserve(el);
      }
    }, { rootMargin: '40px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [allFiltered.length, filteredItems.length]);

  useEffect(() => {
    if (!baseUrl) return;
    const client = getEmiRendererClient();
    void client.configure({
      baseUrl,
      locale,
      theme: getActiveTheme(),
      registryLabels: langLabels,
      onItemClick: () => {},
      onTagClick: () => {},
    });
  }, [baseUrl, locale, langLabels]);

  if (!bundleId) {
    return (
      <div className="item-detail-page">
        <p className="app-empty">{t('noBundle')}</p>
      </div>
    );
  }

  const hasTargets = targets.length > 0;
  const hasSummary = targetSummaries.size > 0;

  const exportJson = useMemo(() => {
    const treeIds = new Set<string>()
    targetSummaries.forEach(s => {
      s.materialIds.forEach(id => treeIds.add(id))
    })
    const filteredSelections: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.selections)) {
      if (treeIds.has(k)) filteredSelections[k] = v
    }
    return JSON.stringify({
      targets: state.targets,
      selections: filteredSelections,
      tagItemSelections,
      tagFluidSelections,
    }, null, 2)
  }, [state, targetSummaries, tagItemSelections, tagFluidSelections])

  return (
    <div className="calc-page">
      <div className="calc-toolbar">
        <div className="calc-search-wrap">
          <input
            type="text"
            className="site-search-input"
            placeholder={t('calcSearchItem')}
            value={inputItem}
            onChange={(e) => {
              setInputItem(e.target.value);
              setSearchLimit(20);
            }}
          />
          {filteredItems.length > 0 && (
            <div className="calc-search-results">
              {filteredItems.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="calc-search-item"
                  onClick={() => handleAddTargetFromSearch(id)}
                >
                  <MaterialIcon
                    itemId={id}
                    bundleId={bundleId}
                    baseUrl={baseUrl}
                    locale={locale}
                    className="calc-search-icon"
                  />
                  <span className="calc-search-label">
                    <FormattedItemLabel label={langLabels[id] || id} />
                  </span>
                </button>
              ))}
              <div ref={sentinelRef} className="calc-search-sentinel" />
            </div>
          )}
        </div>
        <div className="calc-toolbar-actions">
          <button
            type="button"
            className="calc-toolbar-btn"
            onClick={() => setShowExport(true)}
          >
            {t('export')}
          </button>
          <button
            type="button"
            className="calc-toolbar-btn"
            onClick={() => setShowImport(true)}
          >
            {t('import')}
          </button>
          <button
            type="button"
            className="calc-toolbar-btn"
            onClick={() => setShowSummary(s => !s)}
          >
            {t('materialSummaryTitle')}
          </button>
        </div>
      </div>

      {!hasTargets ? (
        <div className="calc-empty">
          <p>{t('calcNoTargets')}</p>
        </div>
      ) : (
        <div className="calc-trees-scroll">
          {targets.map((target, index) => (
            <CalcTargetTree
              key={`${target.itemId}-${index}`}
              target={target}
              index={index}
              bundleId={bundleId}
              baseUrl={baseUrl}
              locale={locale}
              langLabels={langLabels}
              selections={selections}
              tagItemSelections={tagItemSelections}
              tagFluidSelections={tagFluidSelections}
              onSelectRecipe={handleSelectRecipe}
              onClearSelection={handleClearSelection}
              onSelectTag={handleSelectTag}
              onClearTagSelection={handleClearTagSelection}
              onRemoveTarget={removeTarget}
              onAmountChange={setTargetAmount}
              onSummaryReady={(summary) => handleSummaryReady(index, summary)}
            />
          ))}
        </div>
      )}

      {hasSummary && showSummary && (
        <div className="calc-summary-overlay">
          <button
            type="button"
            className="calc-summary-overlay-close"
            onClick={() => setShowSummary(false)}
          >
            ×
          </button>
          <div className="calc-summary-overlay-content">
            <MaterialSummary
              rawMaterials={rawMaterials}
              byproducts={byproducts}
              catalysts={catalysts}
              langLabels={langLabels}
              bundleId={bundleId}
              baseUrl={baseUrl}
              locale={locale}
              targetGroups={targetSummaries}
            />
          </div>
        </div>
      )}

      <RecipeSelectModal
        isOpen={Boolean(selectingFor)}
        selectingFor={selectingFor || ''}
        bundleId={bundleId}
        baseUrl={baseUrl}
        locale={locale}
        langLabels={langLabels}
        manifest={manifest}
        onSelect={handleRecipeSelected}
        onClose={() => setSelectingFor(null)}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        exportJson={exportJson}
      />
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
      <FavoritesDrawer
        baseUrl={baseUrl}
        locale={locale}
        labels={langLabels}
        route={route}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        favorites={favorites}
        onRemoveFavorite={removeItem}
        onToggleFavorite={handleToggleFavorite}
        selectedItems={selectedFavItems}
        onCalculate={handleFavCalculate}
        onAddTarget={handleFavAddTarget}
        onRemoveTarget={handleFavRemoveTarget}
      />
    </div>
  );
}
