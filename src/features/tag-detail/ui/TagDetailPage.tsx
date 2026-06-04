import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/useI18n';
import { parseLocationQuery } from '../../../shared/lib/location-query';
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
import { lookupItemLabel } from '../../../shared/lib/item-labels';
import { TagDetailHeader } from './TagDetailHeader';
import { TagMemberCard } from './TagMemberCard';
import '../../../styles/item-list.css';
import '../../../styles/item-detail.css';

const TAG_MEMBERS_PER_PAGE = 60;

interface TagDetailPageProps {
  tagId: string;
}

export function TagDetailPage({ tagId }: TagDetailPageProps) {
  const { locale, t } = useI18n();
  const location = useLocation();
  const route = parseLocationQuery(location.search);
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const tagQuery = useTagDetailQuery(bundleId, tagId);
  const { scrollElement } = useViewerMain();
  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';
  const [page, setPage] = useState(1);

  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const langQuery = useItemsLangQuery(bundleId, locale, items);
  const labels = langQuery.data?.labels ?? {};

  const members = useMemo(() => {
    if (!tagQuery.data) return [];
    return tagMemberRows(tagQuery.data.kind, tagQuery.data.members);
  }, [tagQuery.data]);

  const totalPages = Math.max(1, Math.ceil(members.length / TAG_MEMBERS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageMembers = useMemo(() => {
    const start = (safePage - 1) * TAG_MEMBERS_PER_PAGE;
    return members.slice(start, start + TAG_MEMBERS_PER_PAGE);
  }, [members, safePage]);

  useEffect(() => {
    if (!baseUrl) return;
    void getEmiRendererClient().configure({ baseUrl, locale, theme: getActiveTheme() });
  }, [baseUrl, locale]);

  useEffect(() => {
    setPage(1);
  }, [tagId]);

  useEffect(() => {
    scrollElement?.scrollTo({ top: 0, behavior: 'auto' });
  }, [safePage, scrollElement, tagId]);

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
              />
            ))}
          </div>
          {members.length === 0 && !loading && (
            <p className="app-empty">{t('emptyTagMembers')}</p>
          )}
          <ListPager
            current={safePage}
            total={totalPages}
            summary={t('tagMembersSummary', { count: members.length })}
            onPage={setPage}
          />
        </>
      )}
    </section>
  );
}
