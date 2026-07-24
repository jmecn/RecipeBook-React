import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { CalcMaterial } from '../model/types';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { MaterialSummary } from './MaterialSummary';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import { RecipeSelectModal } from './RecipeSelectModal';
import { CalcTargetTree, type CalcTargetSummary } from './CalcTargetTree';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';
import { MaterialIcon } from './MaterialIcon';

export function RecipeCalculatorPage() {
  const { locale, t } = useI18n();
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

  const handleImport = useCallback((newState: Parameters<typeof importState>[0]) => {
    importState(newState);
    setTargetSummaries(new Map());
  }, [importState]);

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
            {t('importExportExport')}
          </button>
          <button
            type="button"
            className="calc-toolbar-btn"
            onClick={() => setShowImport(true)}
          >
            {t('importExportImport')}
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
        currentState={state}
      />
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  );
}
