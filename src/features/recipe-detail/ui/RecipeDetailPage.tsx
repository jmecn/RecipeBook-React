import { useEffect, useMemo, useRef } from 'react';
import { hideEmiTagPopover } from 'emi-recipe-renderer';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildNavUrl, parseLocationQuery } from '../../../shared/lib/location-query';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { bundleBaseUrl } from '../../../shared/api/http';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';
import { createRecipeCardElement } from '../../item-detail/lib/recipe-grid-dom';
import { RecipeIdCopyButton } from '../../../shared/ui/RecipeIdCopyButton';
import '../../../styles/item-detail.css';

interface RecipeDetailPageProps {
  recipeId: string;
}

export function RecipeDetailPage({ recipeId }: RecipeDetailPageProps) {
  const { locale, text } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseLocationQuery(location.search);
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const client = useMemo(() => getEmiRendererClient(), []);
  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const langQuery = useItemsLangQuery(bundleId, locale, items);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { scrollElement } = useViewerMain();
  const copyRecipeIdLabels = useMemo(
    () => ({ copyAria: text.copyRecipeIdAria, copiedAria: text.copiedRecipeIdAria }),
    [text.copyRecipeIdAria, text.copiedRecipeIdAria],
  );

  useEffect(() => {
    scrollElement?.scrollTo({ top: 0, behavior: 'auto' });
  }, [recipeId, scrollElement]);

  useEffect(() => {
    if (!bundleId || !gridRef.current) return;
    let session: ReturnType<typeof client.mountRecipeGrid> | null = null;
    let cancelled = false;

    const host = gridRef.current;
    host.replaceChildren();
    host.append(createRecipeCardElement(recipeId, null, { showId: false }));

    void client
      .configure({
        baseUrl: bundleBaseUrl(bundleId),
        locale,
        theme: getActiveTheme(),
        registryLabels: langQuery.data?.labels,
        onItemClick: (clickedId) => {
          hideEmiTagPopover(document.getElementById('tag-popover'));
          navigate(buildNavUrl(route, { view: 'item', id: clickedId, lang: locale }));
        },
        onTagClick: (tag) => {
          hideEmiTagPopover(document.getElementById('tag-popover'));
          const tagId = typeof tag === 'string' ? tag : (tag as { id?: string })?.id;
          if (tagId) navigate(buildNavUrl(route, { view: 'tag', id: tagId, lang: locale }));
        },
      })
      .then(() => {
        if (cancelled || !gridRef.current) return;
        session = client.mountRecipeGrid(gridRef.current, 'single', scrollElement);
      });

    return () => {
      cancelled = true;
      session?.disconnect();
    };
  }, [bundleId, client, langQuery.data?.labels, locale, navigate, recipeId, route, scrollElement]);

  return (
    <section className="item-detail-page recipe-detail-page">
      <header className="item-detail-header recipe-detail-header">
        <div className="item-detail-body recipe-detail-header-body">
          <p className="item-detail-id">{recipeId}</p>
        </div>
        <RecipeIdCopyButton recipeId={recipeId} labels={copyRecipeIdLabels} />
      </header>

      {!bundleId && <p className="app-empty">{text.noBundle}</p>}
      {bundleId && (
        <div ref={gridRef} className="recipe-grid recipe-grid-compact" />
      )}
    </section>
  );
}
