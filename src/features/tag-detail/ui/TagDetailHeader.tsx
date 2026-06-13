import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmiRecipeRenderer } from 'emi-recipe-renderer';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query';
import { useI18n } from '../../../shared/i18n/useI18n';
import { RecipeIdCopyButton } from '../../../shared/ui/RecipeIdCopyButton';

interface TagDetailHeaderProps {
  tagId: string;
  baseUrl: string;
  locale: string;
  route: AppRoute;
  loading?: boolean;
}

export function TagDetailHeader({ tagId, baseUrl, locale, route, loading }: TagDetailHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const copyLabels = useMemo(
    () => ({ copyAria: t('copyAria'), copiedAria: t('copiedAria') }),
    [t],
  );
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const [translatedLabel, setTranslatedLabel] = useState(tagId);

  useEffect(() => {
    setTranslatedLabel(tagId);
    if (loading || !baseUrl) return;
    let cancelled = false;
    void client.translateTag(tagId, { baseUrl, locale }).then((label) => {
      if (!cancelled) setTranslatedLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, client, loading, locale, tagId]);

  useEffect(() => {
    if (loading || !titleRef.current) return;
    if (typeof EmiRecipeRenderer.setFormattedText === 'function') {
      EmiRecipeRenderer.setFormattedText(titleRef.current, translatedLabel);
    } else {
      titleRef.current.textContent = translatedLabel.replace(/§./g, '');
    }
  }, [loading, translatedLabel]);

  return (
    <header className="item-detail-header item-detail-header--tag">
      <button
        type="button"
        className="item-detail-back"
        aria-label={t('backToItemsAria')}
        onClick={() => navigate(buildNavUrl(route, { view: 'items', id: null }))}
      >
        ←
      </button>
      <div className="item-detail-body">
        <h1 ref={titleRef} className={`item-detail-title${loading ? ' is-loading' : ''}`} />
        <div className="item-detail-id-row">
          <p className="item-detail-id">{tagId}</p>
          {!loading && <RecipeIdCopyButton recipeId={tagId} labels={copyLabels} />}
        </div>
      </div>
    </header>
  );
}
