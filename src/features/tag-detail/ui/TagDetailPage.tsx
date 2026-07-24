import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildAppUrl } from '../../../shared/lib/location-query';
import { buildNavUrl } from '../../../shared/lib/location-query';
import { useAppRoute } from '../../../shared/hooks/useAppRoute';
import { LIST_PAGE_SIZE } from '../../../shared/lib/pagination';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { tagMemberRows, useTagDetailQuery } from '../model/queries';
import { bundleBaseUrl } from '../../../shared/api/http';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';
import { ListPager } from '../../../shared/ui/ListPager';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { normalizedFilterQuery } from '../../../shared/lib/canonical-item-id';
import { filterItemIds, lookupItemLabel } from '../../../shared/lib/item-labels';
import { TagDetailHeader } from './TagDetailHeader';
import { TagMemberCard } from './TagMemberCard';
import { FavoritesDrawer } from '../../favorites/ui/FavoritesDrawer';
import { useFavorites } from '../../favorites/hooks/useFavorites';
import { encodeCalcState } from '../../../shared/lib/calc-base64';
import '../../../styles/item-list.css';
import '../../../styles/item-detail.css';

interface TagDetailPageProps {
  tagId: string;
}

export function TagDetailPage({ tagId }: TagDetailPageProps) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const route = useAppRoute();
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const tagQuery = useTagDetailQuery(bundleId, tagId);
  const { scrollElement } = useViewerMain();
  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';
  const page = route.page;

  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const langQuery = useItemsLangQuery(bundleId, locale, items, itemsQuery.isSuccess);
  const labels = useMemo(() => langQuery.data?.labels ?? {}, [langQuery.data?.labels]);

  const { favorites, addItem, removeItem, isFavorite } = useFavorites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFavItems, setSelectedFavItems] = useState<Array<{ itemId: string; amount: number }>>([]);

  const handleToggleFavorite = useCallback((favId: string) => {
    if (isFavorite(favId)) removeItem(favId)
    else addItem(favId)
  }, [isFavorite, addItem, removeItem])

  const handleFavCalculate = useCallback((items: Array<{ itemId: string; amount: number }>) => {
    const encoded = encodeCalcState({ targets: items, selections: {} })
    navigate(buildNavUrl(route, { view: 'calculator', calc: encoded }))
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

  const members = useMemo(() => {
    if (!tagQuery.data) return [];
    return tagMemberRows(tagQuery.data.kind, tagQuery.data.members);
  }, [tagQuery.data]);

  const keyword = route.search;

  const visibleMembers = useMemo(() => {
    const q = normalizedFilterQuery(keyword);
    if (!q) return members;

    const itemIds = members.filter((member) => member.isItem).map((member) => member.id);
    const matchedItems = new Set(
      filterItemIds(itemIds, keyword, langQuery.data?.searchRows ?? null, labels),
    );

    return members.filter((member) => {
      if (member.isItem) return matchedItems.has(member.id);
      return member.raw.toLowerCase().includes(q);
    });
  }, [members, keyword, langQuery.data?.searchRows, labels]);

  const totalPages = Math.max(1, Math.ceil(visibleMembers.length / LIST_PAGE_SIZE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const pageMembers = useMemo(() => {
    const start = (safePage - 1) * LIST_PAGE_SIZE;
    return visibleMembers.slice(start, start + LIST_PAGE_SIZE);
  }, [visibleMembers, safePage]);

  useEffect(() => {
    if (!baseUrl) return;
    void getEmiRendererClient().configure({ baseUrl, locale, theme: getActiveTheme() });
  }, [baseUrl, locale]);

  useEffect(() => {
    scrollElement?.scrollTo({ top: 0, behavior: 'auto' });
  }, [safePage, scrollElement, tagId]);

  useEffect(() => {
    if (page > totalPages && bundleId) {
      navigate(buildAppUrl({ ...route, page: totalPages }), { replace: true });
    }
  }, [bundleId, navigate, page, route, totalPages]);

  const loading = Boolean(bundleId && tagQuery.isLoading);

  return (
    <section className="item-detail-page tag-detail-page">
      <TagDetailHeader
        tagId={tagId}
        baseUrl={baseUrl}
        locale={locale}
        route={route}
        loading={loading}
      />

      {!bundleId && <p className="app-empty">{t('noBundle')}</p>}
      {bundleId && tagQuery.isError && <p className="text-red-400">{t('loadFailed')}</p>}
      {bundleId && !loading && !tagQuery.isError && !tagQuery.data && (
        <p className="app-empty">{t('tagDataNotFound')}</p>
      )}

      {bundleId && (loading || tagQuery.data) && (
        <>
          <div className="item-grid">
            {pageMembers.map((member) => (
              <TagMemberCard
                key={member.raw}
                member={member}
                label={member.isItem ? lookupItemLabel(labels, member.id) : member.raw}
                baseUrl={baseUrl}
                locale={locale}
                route={route}
                isFavorite={member.isItem && isFavorite(member.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
          {visibleMembers.length === 0 && !loading && (
            <p className="app-empty">{t('emptyTagMembers')}</p>
          )}
          <ListPager
            current={safePage}
            total={totalPages}
            summary={t('tagMembersSummary', { count: visibleMembers.length })}
            onPage={(nextPage) => {
              navigate(buildAppUrl({ ...route, page: nextPage }));
            }}
          />
        </>
      )}
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
