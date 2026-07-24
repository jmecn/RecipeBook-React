import { decodeRouteParam } from './routing';

export type AppView = 'items' | 'item' | 'tag' | 'recipe' | 'calculator';

export interface AppRoute {
  view: AppView;
  id: string | null;
  bundleToken: string;
  search: string;
  page: number;
  lang: string | null;
  creativeTab: string | null;
  calc: string | null;
}

export function parseLocationQuery(search: string): AppRoute {
  const params = new URLSearchParams(search);
  const bundleToken = params.get('bundle') || '_';
  const searchText = params.get('search') || '';
  const rawPage = Number.parseInt(params.get('page') || '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const recipe = params.get('recipe');
  const tag = params.get('tag');
  const item = params.get('item');
  const lang = params.get('lang');
  const calc = params.get('calc');
  const rawCreativeTab = params.get('ctab');
  const creativeTab = rawCreativeTab && rawCreativeTab.trim()
    ? decodeRouteParam(rawCreativeTab)
    : null;

  if (calc) {
    return { view: 'calculator', id: null, calc, bundleToken, search: searchText, page, lang, creativeTab };
  }
  if (recipe) {
    return { view: 'recipe', id: decodeRouteParam(recipe), bundleToken, search: searchText, page, lang, creativeTab, calc: null };
  }
  if (tag) return { view: 'tag', id: decodeRouteParam(tag), bundleToken, search: searchText, page, lang, creativeTab, calc: null };
  if (item) {
    return {
      view: 'item',
      id: decodeRouteParam(item).toLowerCase(),
      bundleToken,
      search: searchText,
      page,
      lang,
      creativeTab,
      calc: null,
    };
  }
  return { view: 'items', id: null, bundleToken, search: searchText, page, lang, creativeTab, calc: null };
}

export type AppRoutePatch = Partial<AppRoute>;

export function mergeAppRoute(current: AppRoute, patch: AppRoutePatch): AppRoute {
  const view = patch.view ?? current.view;
  const route: AppRoute = {
    bundleToken: patch.bundleToken ?? current.bundleToken,
    view,
    id: patch.id !== undefined ? patch.id : current.id,
    search: patch.search !== undefined ? patch.search : current.search,
    lang: patch.lang !== undefined ? patch.lang : current.lang,
    page: patch.page !== undefined ? patch.page : current.page,
    creativeTab: patch.creativeTab !== undefined ? patch.creativeTab : current.creativeTab,
    calc: patch.calc !== undefined ? patch.calc : current.calc,
  };

  if (view === 'items' || view === 'calculator') {
    route.id = null;
  }

  if (patch.search !== undefined) {
    return route;
  }

  const viewChanging = patch.view !== undefined && patch.view !== current.view;
  const itemIdChanging =
    patch.id !== undefined && patch.id !== current.id && route.view === 'item';
  if (route.view === 'items' && current.view !== 'items') {
    route.search = '';
    if (patch.page === undefined) route.page = 1;
  }

  if (route.view === 'item' && route.id && (current.view !== 'item' || itemIdChanging)) {
    route.search = '';
  }

  const tagIdChanging =
    patch.id !== undefined && patch.id !== current.id && route.view === 'tag';
  if (route.view === 'tag' && route.id && (current.view !== 'tag' || tagIdChanging) && patch.page === undefined) {
    route.page = 1;
  }

  if (viewChanging && route.view !== 'items' && route.view !== 'item') {
    route.search = '';
  }

  return route;
}

export function buildNavUrl(current: AppRoute, patch: AppRoutePatch): string {
  return buildAppUrl(mergeAppRoute(current, patch));
}

export function buildAppUrl(route: AppRoute) {
  const params = new URLSearchParams();
  if (route.bundleToken && route.bundleToken !== '_') params.set('bundle', route.bundleToken);
  if (route.lang) params.set('lang', route.lang);
  const search = String(route.search || '').trim();
  if (search) params.set('search', search);
  const page = Number.isFinite(route.page) && route.page > 1 ? Math.floor(route.page) : 1;
  if ((route.view === 'items' || route.view === 'tag') && page > 1) {
    params.set('page', String(page));
  }
  if (route.view === 'item' && route.id) params.set('item', route.id);
  if (route.view === 'tag' && route.id) params.set('tag', route.id);
  if (route.view === 'recipe' && route.id) params.set('recipe', route.id);
  if (route.view === 'calculator' && route.calc) params.set('calc', route.calc);
  if (route.creativeTab) params.set('ctab', route.creativeTab);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}
