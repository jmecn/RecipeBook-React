export const FALLBACK_LOCALE = 'en_us';
export const LOCALE_STORAGE_KEY = 'recipeViewerLocale';

export type UiLang = 'en_us' | 'zh_cn';

export interface UiMessages {
  appTitle: string;
  brandTitle: string;
  labelLang: string;
  labelBundle: string;
  labelTheme: string;
  filterItems: string;
  filterDetail: string;
  itemsCount: string;
  itemsLangMissing: string;
  itemDetailTitle: string;
  tabsRecipes: string;
  tabsUses: string;
  tabsTags: string;
  emptyRecipes: string;
  emptyUses: string;
  emptyTags: string;
  recipeDetailTitle: string;
  tagDetailTitle: string;
  loading: string;
  loadFailed: string;
  noBundle: string;
  noDetail: string;
  backToItemsAria: string;
  openTagAria: string;
  tagNotInBundleAria: string;
  tagsShowAll: string;
  emptyTagMembers: string;
  emptyRecipeLayout: string;
  tagMembersSummary: string;
  recipeDetailHeader: string;
  tagDataNotFound: string;
  recipeDataNotFound: string;
  switchingLanguage: string;
  copyRecipeIdAria: string;
  copiedRecipeIdAria: string;
}

export const UI_TEXT: Record<UiLang, UiMessages> = {
  en_us: {
    appTitle: 'Recipe Viewer',
    brandTitle: 'Recipe Viewer home',
    labelLang: 'lang:',
    labelBundle: 'bundle:',
    labelTheme: 'Theme',
    filterItems: 'Filter item id or name...',
    filterDetail: 'Filter recipe id...',
    itemsCount: '{count} items',
    itemsLangMissing: '(id only; items-lang missing — re-export bundle)',
    itemDetailTitle: 'Item Detail',
    tabsRecipes: 'Recipes',
    tabsUses: 'Uses',
    tabsTags: 'Tags',
    emptyRecipes: 'No recipes produce this item.',
    emptyUses: 'No recipes use this item as input.',
    emptyTags: 'No tags for this item.',
    recipeDetailTitle: 'Recipe Detail',
    tagDetailTitle: 'Tag Detail',
    loading: 'Loading...',
    loadFailed: 'Load failed.',
    noBundle: 'No bundle selected.',
    noDetail: 'No detail.',
    backToItemsAria: 'Back to items',
    openTagAria: 'Open tag {id}',
    tagNotInBundleAria: 'Tag {id} not exported in bundle',
    tagsShowAll: 'Show all',
    emptyTagMembers: 'No members found for this tag.',
    emptyRecipeLayout: 'Recipe layout not found.',
    tagMembersSummary: '{count} members',
    recipeDetailHeader: 'Recipe: {id}',
    tagDataNotFound: 'Tag data not found.',
    recipeDataNotFound: 'Recipe data not found.',
    switchingLanguage: 'Switching language...',
    copyRecipeIdAria: 'Copy recipe ID',
    copiedRecipeIdAria: 'Copied',
  },
  zh_cn: {
    appTitle: '配方浏览器',
    brandTitle: '配方浏览器首页',
    labelLang: '语言：',
    labelBundle: '包：',
    labelTheme: '主题',
    filterItems: '按物品 ID 或名称筛选…',
    filterDetail: '按配方 ID 筛选…',
    itemsCount: '{count} 个物品',
    itemsLangMissing: '（仅按 id；缺少 items-lang，请重新导出 bundle）',
    itemDetailTitle: '物品详情',
    tabsRecipes: '配方',
    tabsUses: '用途',
    tabsTags: '标签',
    emptyRecipes: '没有配方产出该物品。',
    emptyUses: '没有配方将该物品作为输入。',
    emptyTags: '该物品没有标签。',
    recipeDetailTitle: '配方详情',
    tagDetailTitle: '标签详情',
    loading: '加载中…',
    loadFailed: '加载失败。',
    noBundle: '未选择 bundle。',
    noDetail: '无详情数据。',
    backToItemsAria: '返回物品列表',
    openTagAria: '打开标签 {id}',
    tagNotInBundleAria: '标签 {id} 未导出到 bundle',
    tagsShowAll: '显示全部',
    emptyTagMembers: '该标签暂无成员。',
    emptyRecipeLayout: '未找到该配方布局。',
    tagMembersSummary: '{count} 个成员',
    recipeDetailHeader: '配方：{id}',
    tagDataNotFound: '未找到标签数据。',
    recipeDataNotFound: '未找到配方数据。',
    switchingLanguage: '正在切换语言…',
    copyRecipeIdAria: '复制配方 ID',
    copiedRecipeIdAria: '已复制',
  },
};

export function normalizeLocale(value: string | null | undefined): string {
  return String(value || FALLBACK_LOCALE).trim().toLowerCase().replace(/-/g, '_');
}

export function uiLocale(locale: string): UiLang {
  const normalized = normalizeLocale(locale);
  return normalized.startsWith('zh') ? 'zh_cn' : 'en_us';
}

export function deepMergeUiText(
  base: Record<UiLang, UiMessages>,
  override?: Partial<Record<string, Partial<UiMessages>>>,
): Record<UiLang, UiMessages> {
  const out: Record<UiLang, UiMessages> = {
    en_us: { ...base.en_us },
    zh_cn: { ...base.zh_cn },
  };
  for (const [locale, table] of Object.entries(override || {})) {
    if (!table || typeof table !== 'object') continue;
    const key = uiLocale(locale);
    out[key] = { ...out[key], ...table };
  }
  return out;
}

export function resolveUiMessages(
  locale: string,
  uiTextOverride?: Partial<Record<string, Partial<UiMessages>>>,
): UiMessages {
  const merged = deepMergeUiText(UI_TEXT, uiTextOverride);
  return merged[uiLocale(locale)] ?? UI_TEXT.en_us;
}

export function formatMessage(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}
