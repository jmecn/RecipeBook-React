import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { applyMinecraftFormattedClasses, hasMinecraftFormatting } from '../../../shared/lib/minecraft-text';
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { lookupItemLabel } from '../../../shared/lib/item-labels';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useI18n } from '../../../shared/i18n/useI18n';
import { RecipeIdCopyButton } from '../../../shared/ui/RecipeIdCopyButton';
import { encodeCalcState } from '../../../shared/lib/calc-base64';
import { FavoriteAddButton } from '../../favorites/ui/FavoriteAddButton';

interface ItemDetailHeaderProps {
  itemId: string;
  baseUrl: string;
  locale: string;
  route: AppRoute;
  loading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string) => void;
}

export function ItemDetailHeader({ itemId, baseUrl, locale, route, loading, isFavorite = false, onToggleFavorite }: ItemDetailHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.(itemId);
  }, [itemId, onToggleFavorite]);
  const copyItemIdLabels = useMemo(
    () => ({ copyAria: t('copyAria'), copiedAria: t('copiedAria') }),
    [t],
  );
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
    if (hasMinecraftFormatting(title)) {
      applyMinecraftFormattedClasses(titleRef.current, title);
    } else {
      titleRef.current.textContent = title;
    }
  }, [loading, title]);

  useEffect(() => {
    if (loading) return;
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountItemIcon(host, { itemId, baseUrl, locale });
    return () => session.disconnect();
  }, [baseUrl, client, itemId, loading, locale]);

  const handleOpenCalculator = () => {
    const calcState = { targets: [{ itemId, amount: 1 }], selections: {}, collapsed: {} };
    navigate(buildNavUrl(route, { view: 'calculator', calc: encodeCalcState(calcState) }));
  };

  return (
    <header className="item-detail-header">
      <button
        type="button"
        className="item-detail-back"
        aria-label={t('backToItemsAria')}
        onClick={() => navigate(buildNavUrl(route, { view: 'items', id: null }))}
      >
        ←
      </button>
      {!loading && <div className="item-detail-icon" ref={iconRef} />}
      <div className="item-detail-body">
        <div className="item-detail-title-row">
          <h1 ref={titleRef} className={`item-detail-title${loading ? ' is-loading' : ''}`} />
          {!loading && onToggleFavorite && <FavoriteAddButton itemId={itemId} isFavorite={isFavorite} onToggle={handleToggleFavorite} />}
        </div>
        <div className="item-detail-id-row">
          <p className="item-detail-id">{itemId}</p>
          {!loading && <RecipeIdCopyButton recipeId={itemId} labels={copyItemIdLabels} />}
        </div>
      </div>
      {!loading && (
        <button
          type="button"
          className="item-detail-calc"
          onClick={handleOpenCalculator}
          title={t('favoritesCalcButton')}
        >
          {t('favoritesCalcButton')}
        </button>
      )}
    </header>
  );
}
