import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../../../shared/i18n/useI18n';
import { RecipeIdCopyButton } from '../../../shared/ui/RecipeIdCopyButton';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query';
import { lookupItemLabel } from '../../../shared/lib/item-labels';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';

interface ItemCardProps {
  itemId: string;
  label?: string;
  baseUrl: string;
  locale: string;
  route: AppRoute;
}

export function ItemCard({ itemId, label, baseUrl, locale, route }: ItemCardProps) {
  const { t } = useI18n();
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const displayLabel = label ?? lookupItemLabel(null, itemId);
  const copyItemIdLabels = useMemo(
    () => ({ copyAria: t('copyAria'), copiedAria: t('copiedAria') }),
    [t],
  );

  useEffect(() => {
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountItemIcon(host, { itemId, baseUrl, locale });
    return () => session.disconnect();
  }, [baseUrl, client, itemId, locale]);

  return (
    <Link
      to={buildNavUrl(route, { view: 'item', id: itemId, lang: locale })}
      className="item-card"
    >
      <span className="item-card-icon" ref={iconRef} />
      <span className="item-card-text">
        <FormattedItemLabel label={displayLabel} className="item-card-name" />
        <span className="item-card-id-row">
          <span className="item-card-id">{itemId}</span>
          <RecipeIdCopyButton recipeId={itemId} labels={copyItemIdLabels} />
        </span>
      </span>
    </Link>
  );
}
