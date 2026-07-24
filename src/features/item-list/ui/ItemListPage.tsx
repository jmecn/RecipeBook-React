import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildAppUrl, buildNavUrl } from '../../../shared/lib/location-query';
import { useNavigate } from 'react-router-dom';
import { useAppRoute } from '../../../shared/hooks/useAppRoute';
import { useItemsCatalogQuery } from '../model/queries';
import { useCreativeTabMembersQuery } from '../model/creative-tabs';
import { useItemsLangQuery } from '../model/items-lang';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { bundleBaseUrl } from '../../../shared/api/http';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { filterItemIds, lookupItemLabel } from '../../../shared/lib/item-labels';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';
import { LIST_PAGE_SIZE } from '../../../shared/lib/pagination';
import { ListPager } from '../../../shared/ui/ListPager';
import { ItemCard } from './ItemCard';
import { FavoritesDrawer } from '../../favorites/ui/FavoritesDrawer';
import { useFavorites } from '../../favorites/hooks/useFavorites';
import { encodeCalcState } from '../../../shared/lib/calc-base64';
import '../../../styles/item-list.css';

export function ItemListPage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const route = useAppRoute();
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const keyword = route.search;
  const creativeTab = route.creativeTab;
  const page = route.page;
  const { scrollElement } = useViewerMain();

  const { favorites, addItem, removeItem, isFavorite } = useFavorites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFavItems, setSelectedFavItems] = useState<Array<{ itemId: string; amount: number }>>([]);

  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = useMemo(
    () => (Array.isArray(itemsQuery.data) ? itemsQuery.data : []),
    [itemsQuery.data],
  );
  const langQuery = useItemsLangQuery(bundleId, locale, items, itemsQuery.isSuccess);
  const membersQuery = useCreativeTabMembersQuery(bundleId, creativeTab);
  const labels = useMemo(() => langQuery.data?.labels ?? {}, [langQuery.data?.labels]);

  const visibleItems = useMemo(() => {
    let ids = items;
    if (creativeTab) {
      if (!membersQuery.isSuccess) return [];
      const memberSet = new Set(membersQuery.data);
      ids = ids.filter((id) => memberSet.has(id));
    }
    return filterItemIds(ids, keyword, langQuery.data?.searchRows ?? null, labels);
  }, [items, creativeTab, membersQuery.data, membersQuery.isSuccess, keyword, langQuery.data?.searchRows, labels]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / LIST_PAGE_SIZE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * LIST_PAGE_SIZE;
    return visibleItems.slice(start, start + LIST_PAGE_SIZE);
  }, [safePage, visibleItems]);

  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';

  const pagerSummary = useMemo(() => {
    const base = t('itemsCount', { count: visibleItems.length });
    const q = keyword.trim();
    if (!q) return base;
    if (langQuery.data?.hasLangIndex) return base;
    return `${base} ${t('itemsLangMissing')}`;
  }, [visibleItems.length, keyword, langQuery.data?.hasLangIndex, t]);

  useEffect(() => {
    if (!baseUrl) return;
    void getEmiRendererClient().configure({ baseUrl, locale, theme: getActiveTheme() });
  }, [baseUrl, locale]);

  useEffect(() => {
    if (langQuery.data?.labels) {
      getEmiRendererClient().setRegistryLabels(langQuery.data.labels);
    }
  }, [langQuery.data?.labels]);

  useEffect(() => {
    scrollElement?.scrollTo({ top: 0, behavior: 'auto' });
  }, [safePage, scrollElement]);

  useEffect(() => {
    if (page > totalPages && bundleId) {
      navigate(buildAppUrl({ ...route, view: 'items', id: null, page: totalPages }), { replace: true });
    }
  }, [bundleId, navigate, page, route, totalPages]);

  const handleToggleFavorite = useCallback((itemId: string) => {
    if (isFavorite(itemId)) {
      removeItem(itemId)
    } else {
      addItem(itemId)
    }
  }, [isFavorite, addItem, removeItem])

  const handleFavCalculate = useCallback((items: Array<{ itemId: string; amount: number }>) => {
    const state = {
      targets: items,
      selections: {},
      collapsed: {},
    }
    const encoded = encodeCalcState(state)
    const url = buildNavUrl(route, { view: 'calculator', calc: encoded })
    navigate(url)
  }, [navigate, route])

  const handleFavAddTarget = useCallback((itemId: string, amount: number) => {
    setSelectedFavItems(prev => {
      const exists = prev.some(i => i.itemId === itemId)
      if (exists) {
        return prev.map(i => i.itemId === itemId ? { ...i, amount } : i)
      }
      return [...prev, { itemId, amount }]
    })
  }, [])

  const handleFavRemoveTarget = useCallback((itemId: string) => {
    setSelectedFavItems(prev => prev.filter(i => i.itemId !== itemId))
  }, [])

  const creativeTabLoading = Boolean(creativeTab && membersQuery.isLoading);

  if (itemsQuery.isLoading || langQuery.isLoading || !langQuery.data || creativeTabLoading) {
    return <section className="item-list-page app-empty">{t('loading')}</section>;
  }

  if (itemsQuery.isError) {
    return <section className="item-list-page app-empty">{t('loadFailed')}</section>;
  }

  if (!bundleId) {
    return <section className="item-list-page app-empty">{t('noBundle')}</section>;
  }

  return (
    <section className="item-list-page app-panel">
      <div className="item-grid">
        {pageItems.map((itemId) => (
          <ItemCard
            key={itemId}
            itemId={itemId}
            label={lookupItemLabel(labels, itemId)}
            baseUrl={baseUrl}
            locale={locale}
            route={route}
            isFavorite={isFavorite(itemId)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
      <ListPager
        current={safePage}
        total={totalPages}
        summary={pagerSummary}
        onPage={(nextPage) => {
          navigate(buildAppUrl({ ...route, view: 'items', id: null, page: nextPage }));
        }}
      />
      <FavoritesDrawer
        baseUrl={baseUrl}
        locale={locale}
        labels={labels}
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
    </section>
  );
}
