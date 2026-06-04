import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hideEmiTagPopover } from 'emi-recipe-renderer';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildNavUrl, parseLocationQuery } from '../../../shared/lib/location-query';
import { formatMessage } from '../../../shared/i18n/messages';
import { useBundlesManifestQuery } from '../../bundle/model/queries';
import { resolveBundleId } from '../../../shared/lib/bundle';
import { useItemsCatalogQuery } from '../../item-list/model/queries';
import { useItemsLangQuery } from '../../item-list/model/items-lang';
import { useItemDetailQuery } from '../model/queries';
import { useCategoriesManifestQuery } from '../model/categories';
import { bundleBaseUrl } from '../../../shared/api/http';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { getActiveTheme } from '../../../shared/lib/theme';
import { useViewerMain } from '../../../shared/hooks/useViewerMain';
import {
  countGroupedRecipes,
  filterRecipeIds,
  recipeIdsForCategory,
  visibleCategoryIds,
} from '../lib/recipe-meta';
import { ItemDetailHeader } from './ItemDetailHeader';
import { CategoryTabs } from './CategoryTabs';
import { RecipeGridPanel } from './RecipeGridPanel';
import '../../../styles/item-detail.css';

interface ItemDetailPageProps {
  itemId: string;
}

const TAG_BUCKETS = ['items', 'blocks', 'fluids'] as const;
type DetailTab = 'recipes' | 'uses' | 'tags';

interface TagEntry {
  id: string;
  bucket: (typeof TAG_BUCKETS)[number];
  clickable: boolean;
}

export function ItemDetailPage({ itemId }: ItemDetailPageProps) {
  const { locale, text } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseLocationQuery(location.search);
  const bundlesQuery = useBundlesManifestQuery();
  const bundleId = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const baseUrl = bundleId ? bundleBaseUrl(bundleId) : '';
  const detailQuery = useItemDetailQuery(bundleId, itemId);
  const itemsQuery = useItemsCatalogQuery(bundleId);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const langQuery = useItemsLangQuery(bundleId, locale, items);
  const categoriesQuery = useCategoriesManifestQuery(bundleId);
  const client = useMemo(() => getEmiRendererClient(), []);

  const [activeTab, setActiveTab] = useState<DetailTab>('recipes');
  const [recipeCategory, setRecipeCategory] = useState('');
  const [usesCategory, setUsesCategory] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const { scrollElement: scrollRoot } = useViewerMain();
  const detailScrollTop = useRef<Record<DetailTab, number>>({ recipes: 0, uses: 0, tags: 0 });

  const keyword = route.search;

  const outputsGrouped = useMemo(
    () => (detailQuery.data?.outputs && typeof detailQuery.data.outputs === 'object'
      ? detailQuery.data.outputs
      : {}),
    [detailQuery.data?.outputs],
  );
  const inputsGrouped = useMemo(
    () => (detailQuery.data?.inputs && typeof detailQuery.data.inputs === 'object'
      ? detailQuery.data.inputs
      : {}),
    [detailQuery.data?.inputs],
  );

  const recipeCategories = useMemo(
    () => visibleCategoryIds(outputsGrouped, categoriesQuery.data ?? null, keyword),
    [outputsGrouped, categoriesQuery.data, keyword],
  );
  const useCategories = useMemo(
    () => visibleCategoryIds(inputsGrouped, categoriesQuery.data ?? null, keyword),
    [inputsGrouped, categoriesQuery.data, keyword],
  );

  const recipeCount = countGroupedRecipes(outputsGrouped, keyword);
  const usesCount = countGroupedRecipes(inputsGrouped, keyword);

  const tagEntries = useMemo(() => {
    const tags = detailQuery.data?.tags;
    const tagsInBundle = detailQuery.data?.tagsInBundle;
    const seen = new Set<string>();
    const out: TagEntry[] = [];
    for (const bucket of TAG_BUCKETS) {
      const ids = Array.isArray(tags?.[bucket]) ? tags[bucket]! : [];
      const bundleList = Array.isArray(tagsInBundle?.[bucket]) ? tagsInBundle[bucket]! : [];
      for (const id of ids) {
        if (typeof id !== 'string' || seen.has(id)) continue;
        seen.add(id);
        out.push({
          id,
          bucket,
          clickable: bundleList.includes(id),
        });
      }
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }, [detailQuery.data?.tags, detailQuery.data?.tagsInBundle]);

  const inBundleTagEntries = useMemo(
    () => tagEntries.filter((entry) => entry.clickable),
    [tagEntries],
  );
  const extraTagEntries = useMemo(
    () => tagEntries.filter((entry) => !entry.clickable),
    [tagEntries],
  );
  const visibleTagEntries = showAllTags ? tagEntries : inBundleTagEntries;

  useEffect(() => {
    if (!baseUrl) return;
    void client.configure({
      baseUrl,
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
    });
  }, [baseUrl, client, langQuery.data?.labels, locale, navigate, route]);

  useEffect(() => {
    if (recipeCategories.length > 0 && !recipeCategories.includes(recipeCategory)) {
      setRecipeCategory(recipeCategories[0]);
    }
  }, [recipeCategories, recipeCategory]);

  useEffect(() => {
    if (useCategories.length > 0 && !useCategories.includes(usesCategory)) {
      setUsesCategory(useCategories[0]);
    }
  }, [useCategories, usesCategory]);

  useEffect(() => {
    setRecipeCategory('');
    setUsesCategory('');
    setActiveTab('recipes');
    setShowAllTags(false);
    detailScrollTop.current = { recipes: 0, uses: 0, tags: 0 };
    scrollRoot?.scrollTo({ top: 0, behavior: 'auto' });
  }, [itemId, scrollRoot]);

  useEffect(() => {
    detailScrollTop.current.recipes = 0;
    detailScrollTop.current.uses = 0;
    if (activeTab === 'recipes' || activeTab === 'uses') {
      scrollRoot?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [keyword, activeTab, scrollRoot]);

  const activeRecipeCategory = recipeCategory || recipeCategories[0] || '';
  const activeUsesCategory = usesCategory || useCategories[0] || '';

  const recipeIds = useMemo(
    () => filterRecipeIds(
      recipeIdsForCategory(outputsGrouped, activeRecipeCategory),
      keyword,
    ),
    [outputsGrouped, activeRecipeCategory, keyword],
  );
  const useIds = useMemo(
    () => filterRecipeIds(
      recipeIdsForCategory(inputsGrouped, activeUsesCategory),
      keyword,
    ),
    [inputsGrouped, activeUsesCategory, keyword],
  );

  const openRecipe = useCallback((recipeId: string) => {
    navigate(buildNavUrl(route, { view: 'recipe', id: recipeId, lang: locale }));
  }, [locale, navigate, route]);

  const copyRecipeIdLabels = useMemo(
    () => ({ copyAria: text.copyRecipeIdAria, copiedAria: text.copiedRecipeIdAria }),
    [text.copyRecipeIdAria, text.copiedRecipeIdAria],
  );

  const switchTab = useCallback((tab: DetailTab) => {
    if (scrollRoot) {
      detailScrollTop.current[activeTab] = scrollRoot.scrollTop;
    }
    setActiveTab(tab);
    requestAnimationFrame(() => {
      scrollRoot?.scrollTo({ top: detailScrollTop.current[tab] || 0, behavior: 'auto' });
    });
  }, [activeTab, scrollRoot]);

  const loading = Boolean(bundleId && detailQuery.isLoading);

  return (
    <section className="item-detail-page">
      <ItemDetailHeader itemId={itemId} baseUrl={baseUrl} locale={locale} route={route} loading={loading} />

      {!bundleId && <p className="app-empty">{text.noBundle}</p>}
      {bundleId && detailQuery.isError && <p className="text-red-400">{text.loadFailed}</p>}
      {bundleId && !loading && !detailQuery.isError && !detailQuery.data && (
        <p className="app-empty">{text.noDetail}</p>
      )}

      {bundleId && (loading || detailQuery.data) && (
        <>
          <nav className="detail-tabs" aria-label="Item recipe tabs">
            <TabButton
              active={activeTab === 'recipes'}
              label={`${text.tabsRecipes} (${recipeCount})`}
              onClick={() => switchTab('recipes')}
            />
            <TabButton
              active={activeTab === 'uses'}
              label={`${text.tabsUses} (${usesCount})`}
              onClick={() => switchTab('uses')}
            />
            <TabButton
              active={activeTab === 'tags'}
              label={`${text.tabsTags} (${tagEntries.length})`}
              onClick={() => switchTab('tags')}
            />
          </nav>

          <section className="detail-panel" hidden={activeTab !== 'recipes'}>
            <CategoryTabs
              categories={recipeCategories}
              activeCategory={activeRecipeCategory}
              manifest={categoriesQuery.data ?? null}
              baseUrl={baseUrl}
              locale={locale}
              grouped={outputsGrouped}
              keyword={keyword}
              onSelect={setRecipeCategory}
            />
            {recipeCount === 0 && <p className="app-empty">{text.emptyRecipes}</p>}
            <RecipeGridPanel
              key={`recipes:${activeRecipeCategory}:${keyword}`}
              recipeIds={recipeIds}
              panelKey="recipes"
              scrollRoot={scrollRoot}
              enabled={activeTab === 'recipes' && recipeIds.length > 0}
              onRecipeIdClick={openRecipe}
              copyRecipeIdLabels={copyRecipeIdLabels}
            />
          </section>

          <section className="detail-panel" hidden={activeTab !== 'uses'}>
            <CategoryTabs
              categories={useCategories}
              activeCategory={activeUsesCategory}
              manifest={categoriesQuery.data ?? null}
              baseUrl={baseUrl}
              locale={locale}
              grouped={inputsGrouped}
              keyword={keyword}
              onSelect={setUsesCategory}
            />
            {usesCount === 0 && <p className="app-empty">{text.emptyUses}</p>}
            <RecipeGridPanel
              key={`uses:${activeUsesCategory}:${keyword}`}
              recipeIds={useIds}
              panelKey="uses"
              scrollRoot={scrollRoot}
              enabled={activeTab === 'uses' && useIds.length > 0}
              onRecipeIdClick={openRecipe}
              copyRecipeIdLabels={copyRecipeIdLabels}
            />
          </section>

          <section className="detail-panel" hidden={activeTab !== 'tags'}>
            {tagEntries.length === 0 && <p className="app-empty">{text.emptyTags}</p>}
            {tagEntries.length > 0 && (
              <>
                {visibleTagEntries.length > 0 && (
                  <div className="item-tags-list">
                    {visibleTagEntries.map((entry) => (
                      <TagChip key={entry.id} entry={entry} route={route} locale={locale} text={text} />
                    ))}
                  </div>
                )}
                {extraTagEntries.length > 0 && !showAllTags && (
                  <button
                    type="button"
                    className="item-tags-more"
                    onClick={() => setShowAllTags(true)}
                  >
                    {text.tagsShowAll}
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="detail-tab"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TagChip({
  entry,
  route,
  locale,
  text,
}: {
  entry: TagEntry;
  route: ReturnType<typeof parseLocationQuery>;
  locale: string;
  text: ReturnType<typeof useI18n>['text'];
}) {
  if (entry.clickable) {
    return (
      <Link
        to={buildNavUrl(route, { view: 'tag', id: entry.id, lang: locale })}
        className="item-tag-chip"
        aria-label={formatMessage(text.openTagAria, { id: entry.id })}
      >
        {entry.id}
      </Link>
    );
  }
  return (
    <span
      className="item-tag-chip is-disabled"
      aria-label={formatMessage(text.tagNotInBundleAria, { id: entry.id })}
    >
      {entry.id}
    </span>
  );
}
