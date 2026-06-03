import { useEffect, useMemo } from 'react';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildAppUrl, parseLocationQuery } from '../../../shared/lib/location-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useItemsCatalogQuery } from '../model/queries';
import { useItemsLangQuery } from '../model/items-lang';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { formatMessage } from '../../../shared/i18n/messages';
import { bundleBaseUrl } from '../../../shared/api/http';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { filterItemIds, lookupItemLabel } from '../../../shared/lib/item-labels';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';
import { ListPager } from '../../../shared/ui/ListPager';
import { ItemCard } from './ItemCard';
import '../../../styles/item-list.css';

const ITEMS_PER_PAGE = 60;

export function ItemListPage() {
  const { locale, text } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseLocationQuery(location.search);
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const keyword = route.search;
  const page = route.page;
  const { scrollElement } = useViewerMain();

  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = useMemo(
    () => (Array.isArray(itemsQuery.data) ? itemsQuery.data : []),
    [itemsQuery.data],
  );
  const langQuery = useItemsLangQuery(bundleId, locale, items);

  const visibleItems = useMemo(() => {
    return filterItemIds(items, keyword, langQuery.data?.searchRows ?? null);
  }, [items, keyword, langQuery.data?.searchRows]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return visibleItems.slice(start, start + ITEMS_PER_PAGE);
  }, [safePage, visibleItems]);

  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';
  const labels = langQuery.data?.labels ?? {};

  const pagerSummary = useMemo(() => {
    const base = formatMessage(text.itemsCount, { count: visibleItems.length });
    const q = keyword.trim();
    if (!q) return base;
    if (langQuery.data?.hasLangIndex) return base;
    return `${base} ${text.itemsLangMissing}`;
  }, [visibleItems.length, keyword, langQuery.data?.hasLangIndex, text]);

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

  if (itemsQuery.isLoading || langQuery.isLoading || !langQuery.data) {
    return <section className="item-list-page app-empty">{text.loading}</section>;
  }

  if (itemsQuery.isError) {
    return <section className="item-list-page app-empty">{text.loadFailed}</section>;
  }

  if (!bundleId) {
    return <section className="item-list-page app-empty">{text.noBundle}</section>;
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
    </section>
  );
}
