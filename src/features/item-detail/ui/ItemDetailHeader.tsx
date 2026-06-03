import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmiRecipeRenderer } from 'emi-recipe-renderer';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { lookupItemLabel } from '../../../shared/lib/item-labels';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useI18n } from '../../../shared/i18n/useI18n';

interface ItemDetailHeaderProps {
  itemId: string;
  baseUrl: string;
  locale: string;
  route: AppRoute;
  loading?: boolean;
}

export function ItemDetailHeader({ itemId, baseUrl, locale, route, loading }: ItemDetailHeaderProps) {
  const navigate = useNavigate();
  const { text } = useI18n();
  const iconRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const langQuery = useItemsLangQuery(bundleId, locale, items);
  const title = lookupItemLabel(langQuery.data?.labels, itemId);

  useEffect(() => {
    if (loading || !titleRef.current) return;
    if (typeof EmiRecipeRenderer.setFormattedText === 'function') {
      EmiRecipeRenderer.setFormattedText(titleRef.current, title);
    } else {
      titleRef.current.textContent = title.replace(/§./g, '');
    }
  }, [loading, title]);

  useEffect(() => {
    if (loading) return;
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountItemIcon(host, { itemId, baseUrl, locale });
    return () => session.disconnect();
  }, [baseUrl, client, itemId, loading, locale]);

  return (
    <header className="item-detail-header">
      <button
        type="button"
        className="item-detail-back"
        aria-label={text.backToItemsAria}
        onClick={() => navigate(buildNavUrl(route, { view: 'items', id: null }))}
      >
        ←
      </button>
      {!loading && <div className="item-detail-icon" ref={iconRef} />}
      <div className="item-detail-body">
        <h1 ref={titleRef} className={`item-detail-title${loading ? ' is-loading' : ''}`} />
        <p className="item-detail-id">{itemId}</p>
      </div>
    </header>
  );
}
