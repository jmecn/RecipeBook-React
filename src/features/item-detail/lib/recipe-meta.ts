export const VIRTUAL_ROW_HEIGHT = 260;
export const RECIPE_META_MARGIN = 4;
export const RECIPE_CARD_PADDING_Y = 36;
export const RECIPE_GRID_ROW_GAP = 12;
export const VIRTUAL_BUFFER_ROWS = 2;
export const VIRTUAL_MAX_WINDOW_ITEMS = 48;

export interface CategoriesManifest {
  categories: Array<{
    id: string;
    order?: number;
    priority?: number;
    nameKey?: string;
    iconItem?: string;
    iconKey?: string;
  }>;
  byId: Map<string, CategoriesManifest['categories'][number]>;
  order: string[];
  iconCellSize: number;
}

export function parseCategoriesManifest(raw: unknown): CategoriesManifest {
  const empty = { categories: [], byId: new Map(), order: [], iconCellSize: 16 };
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { categories?: unknown }).categories)) {
    return empty;
  }
  const categories = (raw as { categories: CategoriesManifest['categories'] }).categories
    .filter((c) => c && typeof c.id === 'string');
  categories.sort((a, b) => {
    const ao = Number.isFinite(a.order) ? (a.order as number) : Number.MAX_SAFE_INTEGER;
    const bo = Number.isFinite(b.order) ? (b.order as number) : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    const ap = Number.isFinite(a.priority) ? (a.priority as number) : 0;
    const bp = Number.isFinite(b.priority) ? (b.priority as number) : 0;
    if (ap !== bp) return ap - bp;
    return a.id.localeCompare(b.id);
  });
  const byId = new Map<string, CategoriesManifest['categories'][number]>();
  const order: string[] = [];
  for (const entry of categories) {
    byId.set(entry.id, entry);
    order.push(entry.id);
  }
  const iconCellSize = Number.isFinite((raw as { iconCellSize?: number }).iconCellSize)
    ? (raw as { iconCellSize: number }).iconCellSize
    : 16;
  return { categories, byId, order, iconCellSize };
}

export function isEmiTagDisplayRecipe(recipeId: string) {
  return String(recipeId || '').startsWith('emi:/tag/');
}

export function craftingRecipeIds(ids: string[]) {
  return ids.filter((id) => !isEmiTagDisplayRecipe(id));
}

export function recipeIdsForCategory(grouped: Record<string, string[]>, categoryId: string) {
  if (!grouped || !categoryId) return [];
  return craftingRecipeIds(grouped[categoryId] || []);
}

export function filterRecipeIds(ids: string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return ids;
  return ids.filter((id) => id.toLowerCase().includes(q));
}

export function sortCategoryIds(categoryIds: string[], manifest: CategoriesManifest | null) {
  const rank = new Map((manifest?.order || []).map((id, index) => [id, index]));
  return [...categoryIds].sort((a, b) => {
    const ai = rank.has(a) ? rank.get(a)! : Number.MAX_SAFE_INTEGER;
    const bi = rank.has(b) ? rank.get(b)! : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}

export function visibleCategoryIds(
  grouped: Record<string, string[]>,
  manifest: CategoriesManifest | null,
  query: string,
) {
  const ids = Object.keys(grouped).filter((categoryId) => (
    filterRecipeIds(recipeIdsForCategory(grouped, categoryId), query).length > 0
  ));
  return sortCategoryIds(ids, manifest);
}

export function countGroupedRecipes(grouped: Record<string, string[]>, query: string) {
  let total = 0;
  for (const categoryId of Object.keys(grouped)) {
    total += filterRecipeIds(recipeIdsForCategory(grouped, categoryId), query).length;
  }
  return total;
}

export function categoryRecipeCount(
  grouped: Record<string, string[]>,
  categoryId: string,
  query: string,
) {
  return filterRecipeIds(recipeIdsForCategory(grouped, categoryId), query).length;
}

export function categoryDisplayLabel(categoryId: string, manifest: CategoriesManifest | null) {
  const entry = manifest?.byId.get(categoryId);
  if (entry?.nameKey) {
    const key = entry.nameKey;
    const tail = key.split('.').pop() || key;
    return tail.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const tail = categoryId.includes(':') ? categoryId.split(':')[1] : categoryId;
  return tail.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function itemDisplayTitle(itemId: string) {
  const path = itemId.includes(':') ? itemId.split(':')[1] : itemId;
  return path.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
