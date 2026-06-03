import { useEffect, useMemo, useRef, useState } from 'react';
import { EmiRecipeRenderer } from 'emi-recipe-renderer';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import {
  categoryDisplayLabel,
  categoryRecipeCount,
  type CategoriesManifest,
} from '../lib/recipe-meta';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  manifest: CategoriesManifest | null;
  baseUrl: string;
  locale: string;
  grouped: Record<string, string[]>;
  keyword: string;
  onSelect: (categoryId: string) => void;
}

function stripFormatting(text: string) {
  return String(text || '').replace(/§./g, '');
}

function CategoryTab({
  categoryId,
  active,
  manifest,
  baseUrl,
  locale,
  grouped,
  keyword,
  onSelect,
}: {
  categoryId: string;
  active: boolean;
  manifest: CategoriesManifest | null;
  baseUrl: string;
  locale: string;
  grouped: Record<string, string[]>;
  keyword: string;
  onSelect: (id: string) => void;
}) {
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);
  const [label, setLabel] = useState(() => categoryDisplayLabel(categoryId, manifest));
  const recipeCount = categoryRecipeCount(grouped, categoryId, keyword);

  useEffect(() => {
    let cancelled = false;
    void client.getCategoryLabel(categoryId, manifest, { baseUrl, locale }).then((text) => {
      if (!cancelled) setLabel(text);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId, client, manifest, baseUrl, locale]);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    if (typeof EmiRecipeRenderer.setFormattedText === 'function') {
      EmiRecipeRenderer.setFormattedText(el, label);
    } else {
      el.textContent = stripFormatting(label);
    }
  }, [label]);

  useEffect(() => {
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountCategoryIcon(host, {
      categoryId,
      baseUrl,
      locale,
      iconCellSize: manifest?.iconCellSize,
    });
    return () => session.disconnect();
  }, [baseUrl, categoryId, client, locale, manifest?.iconCellSize]);

  const title = `${stripFormatting(label)} (${recipeCount})`;

  return (
    <button
      type="button"
      className={`emi-category-tab${active ? ' is-active' : ''}`}
      aria-current={active ? 'true' : undefined}
      title={title}
      onClick={() => onSelect(categoryId)}
    >
      <span className="emi-category-tab-icon" ref={iconRef} />
      <span className="emi-category-tab-label">
        <span ref={labelRef} />
        <span className="emi-category-tab-count">{` (${recipeCount})`}</span>
      </span>
    </button>
  );
}

export function CategoryTabs({
  categories,
  activeCategory,
  manifest,
  baseUrl,
  locale,
  grouped,
  keyword,
  onSelect,
}: CategoryTabsProps) {
  if (categories.length === 0) return null;
  return (
    <nav className="emi-category-tabs" aria-label="Recipe categories">
      {categories.map((categoryId) => (
        <CategoryTab
          key={categoryId}
          categoryId={categoryId}
          active={categoryId === activeCategory}
          manifest={manifest}
          baseUrl={baseUrl}
          locale={locale}
          grouped={grouped}
          keyword={keyword}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
