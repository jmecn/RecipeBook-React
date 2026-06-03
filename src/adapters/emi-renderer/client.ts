import {
  EmiRecipeRenderer,
  type EmiRendererOptions,
  type EmiMountOptions,
  type EmiLazyMountHandle,
  type EmiThemeName,
} from 'emi-recipe-renderer';
import type { Theme } from '../../shared/lib/theme';
import {
  categoryDisplayLabel,
  type CategoriesManifest,
} from '../../features/item-detail/lib/recipe-meta';
import {
  FALLBACK_CATEGORY_LAYOUT,
  mergeCategoryLayouts,
  rowStrideFromMeta,
  type CategoryRecipeLayout,
} from '../../features/item-detail/lib/category-recipe-layout';

export interface IconMountSession {
  disconnect(): void;
  flush(): Promise<void>;
}

export interface MountItemIconOptions {
  itemId: string;
  fallbackText?: string;
  baseUrl?: string;
  locale?: string;
}

export interface MountCategoryIconOptions {
  categoryId: string;
  baseUrl?: string;
  locale?: string;
  iconCellSize?: number;
}

export interface MountRecipeCardOptions {
  recipeId: string;
  hostClassName?: string;
}

export interface ConfigureEmiRendererOptions {
  baseUrl: string;
  locale: string;
  theme?: Theme;
  registryLabels?: Record<string, string>;
  onItemClick?: EmiRendererOptions['onItemClick'];
  onTagClick?: EmiRendererOptions['onTagClick'];
}

type EmiRendererWithIcons = EmiRecipeRenderer & {
  onItemClick?: EmiRendererOptions['onItemClick'];
  onTagClick?: EmiRendererOptions['onTagClick'];
  ensureIconStylesheets(): Promise<void>;
  ensureCategoryIconStylesheets?(): Promise<void>;
  setLocale?(locale: string): Promise<void> | void;
  setTheme?(theme: EmiThemeName): void;
  setRegistryLabels?(labels: Record<string, string>): void;
  ensureOverlayElements?(): void;
  translate?(key: string): string;
  translateKey?(key: string): string;
  translateTag?(tag: string): string;
  categoryIconAtlas?: { cellSize?: number };
};

export interface EmiRendererClient {
  configure(options: ConfigureEmiRendererOptions): Promise<void>;
  setRegistryLabels(labels: Record<string, string>): void;
  setTheme(theme: Theme): void;
  mountItemIcon(host: HTMLElement, options: MountItemIconOptions): IconMountSession;
  mountRecipeCard(host: HTMLElement, options: MountRecipeCardOptions): IconMountSession;
  mountRecipeGrid(root: HTMLElement, panelKey: string, observeRoot: HTMLElement | null): IconMountSession;
  mountCategoryIcon(host: HTMLElement, options: MountCategoryIconOptions): IconMountSession;
  getCategoryLabel(
    categoryId: string,
    manifest: CategoriesManifest | null,
    options?: { baseUrl?: string; locale?: string },
  ): Promise<string>;
  probeRecipeRowHeight(recipeIds: string[]): Promise<number>;
  probeCategoryRecipeLayout(recipeIds: string[]): Promise<CategoryRecipeLayout>;
  observePendingRecipeCards(root: HTMLElement, panelKey: string, observeRoot: HTMLElement | null): IconMountSession;
  translateTag(tagId: string, options?: { baseUrl?: string; locale?: string }): Promise<string>;
}

function mountOptionsFromClient(client: EmiRendererClientImpl): EmiMountOptions {
  return {
    baseUrl: client.baseUrl,
    locale: client.locale,
    theme: client.theme,
    registryLabels: client.registryLabels,
    injectIconStylesheets: true,
    onItemClick: client.onItemClick,
    onTagClick: client.onTagClick,
    tooltipElementId: 'tooltip',
    tagPopoverElementId: 'tag-popover',
    renderer: client.getRenderer() as EmiRecipeRenderer,
  };
}

function rendererOptionsFromClient(client: EmiRendererClientImpl): EmiRendererOptions {
  return {
    baseUrl: client.baseUrl,
    locale: client.locale,
    theme: client.theme,
    injectIconStylesheets: true,
    onItemClick: client.onItemClick,
    onTagClick: client.onTagClick,
    registryLabels: client.registryLabels,
    tooltipElementId: 'tooltip',
    tagPopoverElementId: 'tag-popover',
  } as EmiRendererOptions;
}

async function ensureIconResources(renderer: EmiRendererWithIcons) {
  await renderer.ensureIconStylesheets();
  if (typeof renderer.ensureCategoryIconStylesheets === 'function') {
    await renderer.ensureCategoryIconStylesheets();
  }
}

class EmiRendererClientImpl implements EmiRendererClient {
  baseUrl = '';
  locale = 'zh_cn';
  theme: EmiThemeName = 'dark';
  registryLabels: Record<string, string> = {};
  onItemClick?: EmiRendererOptions['onItemClick'];
  onTagClick?: EmiRendererOptions['onTagClick'];
  private renderer: EmiRecipeRenderer | null = null;
  private mountSessions = new Map<string, EmiLazyMountHandle | null>();
  private configurePromise: Promise<void> | null = null;

  private createRenderer() {
    this.renderer = new EmiRecipeRenderer(rendererOptionsFromClient(this));
    return this.renderer;
  }

  getRenderer() {
    return this.renderer ?? this.createRenderer();
  }

  private applyRegistryLabels(labels?: Record<string, string>) {
    const renderer = this.renderer as EmiRendererWithIcons | null;
    if (!renderer?.setRegistryLabels) return;
    renderer.setRegistryLabels(labels ?? this.registryLabels);
  }

  private async warmupRenderer() {
    const renderer = this.getRenderer() as EmiRendererWithIcons;
    await renderer.loadIndex();
    await ensureIconResources(renderer);
    if (typeof renderer.setLocale === 'function') {
      await renderer.setLocale(this.locale);
    }
    this.applyRegistryLabels();
    return renderer;
  }

  setRegistryLabels(labels: Record<string, string>) {
    this.registryLabels = labels;
    this.applyRegistryLabels(labels);
  }

  async configure(options: ConfigureEmiRendererOptions) {
    const baseChanged = this.baseUrl !== options.baseUrl;
    this.baseUrl = options.baseUrl;
    this.locale = options.locale;
    if (options.registryLabels) {
      this.registryLabels = options.registryLabels;
    }
    if (options.theme) this.theme = options.theme;
    this.onItemClick = options.onItemClick;
    this.onTagClick = options.onTagClick;

    if (!this.renderer || baseChanged) {
      this.createRenderer();
      this.configurePromise = this.warmupRenderer().then(() => undefined);
    } else {
      const iconRenderer = this.renderer as EmiRendererWithIcons;
      iconRenderer.onItemClick = this.onItemClick;
      iconRenderer.onTagClick = this.onTagClick;
      if (typeof iconRenderer.setLocale === 'function') {
        await iconRenderer.setLocale(this.locale);
      }
      this.setTheme(this.theme);
      this.configurePromise = ensureIconResources(iconRenderer).then(() => undefined);
    }
    await this.configurePromise;
    this.applyRegistryLabels();
    (this.renderer as EmiRendererWithIcons | null)?.ensureOverlayElements?.();
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    const iconRenderer = this.renderer as EmiRendererWithIcons | null;
    if (iconRenderer && typeof iconRenderer.setTheme === 'function') {
      iconRenderer.setTheme(theme);
    }
  }

  private async ensureReadyForMount(options?: { baseUrl?: string; locale?: string }): Promise<EmiRecipeRenderer> {
    if (options?.baseUrl) {
      await this.configure({
        baseUrl: options.baseUrl,
        locale: options.locale ?? this.locale,
        theme: this.theme,
        onItemClick: this.onItemClick,
        onTagClick: this.onTagClick,
      });
      return this.getRenderer();
    }
    if (this.configurePromise) await this.configurePromise;
    else await this.warmupRenderer();
    return this.getRenderer();
  }

  mountItemIcon(host: HTMLElement, options: MountItemIconOptions): IconMountSession {
    let cancelled = false;
    const fallbackText = options.fallbackText || '??';
    host.textContent = fallbackText;
    host.title = options.itemId;

    void this.ensureReadyForMount({ baseUrl: options.baseUrl, locale: options.locale })
      .then(async (renderer) => {
        if (cancelled) return;
        const iconRenderer = renderer as EmiRendererWithIcons;
        await iconRenderer.ensureIconStylesheets();
        const span = iconRenderer.createAtlasSpanForIconKey(options.itemId);
        host.replaceChildren(span);
        host.dataset.iconMounted = '1';
      })
      .catch(() => {
        if (cancelled) return;
        host.textContent = fallbackText;
      });

    return {
      disconnect: () => {
        cancelled = true;
        host.replaceChildren();
        delete host.dataset.iconMounted;
      },
      flush: async () => undefined,
    };
  }

  mountCategoryIcon(host: HTMLElement, options: MountCategoryIconOptions): IconMountSession {
    let cancelled = false;
    host.replaceChildren();

    void this.ensureReadyForMount({ baseUrl: options.baseUrl, locale: options.locale })
      .then(async (renderer) => {
        if (cancelled) return;
        const iconRenderer = renderer as EmiRendererWithIcons;
        await iconRenderer.ensureIconStylesheets();
        if (typeof iconRenderer.ensureCategoryIconStylesheets === 'function') {
          await iconRenderer.ensureCategoryIconStylesheets();
        }
        const span = iconRenderer.createAtlasSpanForCategoryIcon(options.categoryId);
        const displayPx = 16;
        const atlasCell = iconRenderer.categoryIconAtlas?.cellSize
          || options.iconCellSize
          || displayPx;
        if (atlasCell > displayPx) {
          const scale = displayPx / atlasCell;
          span.style.transform = `scale(${scale})`;
          span.style.transformOrigin = 'top left';
        }
        host.appendChild(span);
      })
      .catch(() => {
        if (cancelled) return;
      });

    return {
      disconnect: () => {
        cancelled = true;
        host.replaceChildren();
      },
      flush: async () => undefined,
    };
  }

  mountRecipeCard(host: HTMLElement, options: MountRecipeCardOptions): IconMountSession {
    const mountNode = document.createElement('div');
    mountNode.className = options.hostClassName || 'emi-recipe';
    mountNode.dataset.recipeId = options.recipeId;
    host.replaceChildren(mountNode);

    let cancelled = false;
    void this.ensureReadyForMount().then(() => {
      if (cancelled) return;
      return EmiRecipeRenderer.mountElement(mountNode, mountOptionsFromClient(this));
    }).catch(() => {
      if (cancelled) return;
      mountNode.textContent = 'Failed to load recipe.';
    });

    return {
      disconnect: () => {
        cancelled = true;
        host.replaceChildren();
      },
      flush: async () => undefined,
    };
  }

  async getCategoryLabel(
    categoryId: string,
    manifest: CategoriesManifest | null,
    options?: { baseUrl?: string; locale?: string },
  ) {
    const renderer = await this.ensureReadyForMount(options) as EmiRendererWithIcons;
    const entry = manifest?.byId.get(categoryId);
    const key = entry?.nameKey;
    if (key) {
      const translate = (lookup: string) => renderer.translate?.(lookup)
        ?? renderer.translateKey?.(lookup)
        ?? lookup;
      const label = translate(key);
      if (label && label !== key) return label;
    }
    return categoryDisplayLabel(categoryId, manifest);
  }

  mountRecipeGrid(root: HTMLElement, panelKey: string, observeRoot: HTMLElement | null): IconMountSession {
    return this.startLazyRecipeMount(root, panelKey, observeRoot);
  }

  observePendingRecipeCards(root: HTMLElement, panelKey: string, observeRoot: HTMLElement | null): IconMountSession {
    return this.startLazyRecipeMount(root, panelKey, observeRoot);
  }

  private startLazyRecipeMount(
    root: HTMLElement,
    panelKey: string,
    observeRoot: HTMLElement | null,
  ): IconMountSession {
    const prev = this.mountSessions.get(panelKey);
    prev?.disconnect();
    this.mountSessions.set(panelKey, null);

    let cancelled = false;
    void this.ensureReadyForMount().then(() => {
      if (cancelled) return;
      return EmiRecipeRenderer.mountAll({
        root,
        ...mountOptionsFromClient(this),
        lazy: true,
        observeRoot,
        rootMargin: '120px 0px',
      });
    }).then((session) => {
      if (!session || cancelled) {
        if (session && 'disconnect' in session) session.disconnect();
        return;
      }
      this.mountSessions.set(panelKey, session as EmiLazyMountHandle);
    });

    return {
      disconnect: () => {
        cancelled = true;
        this.mountSessions.get(panelKey)?.disconnect();
        this.mountSessions.set(panelKey, null);
      },
      flush: async () => {
        await this.mountSessions.get(panelKey)?.flush();
      },
    };
  }

  async probeCategoryRecipeLayout(recipeIds: string[]): Promise<CategoryRecipeLayout> {
    if (!recipeIds.length) return FALLBACK_CATEGORY_LAYOUT;
    await this.ensureReadyForMount();
    const renderer = this.getRenderer();
    const index = await renderer.loadIndex();
    const imageScale = Number.isFinite((index as { imageScale?: number })?.imageScale)
      ? (index as { imageScale: number }).imageScale
      : 2;
    const sample = recipeIds.slice(0, Math.min(recipeIds.length, 3));
    const layouts: CategoryRecipeLayout[] = [];
    for (const recipeId of sample) {
      try {
        const meta = await renderer.loadRecipeMeta(recipeId);
        layouts.push(rowStrideFromMeta(meta, imageScale));
      } catch {
        continue;
      }
    }
    return mergeCategoryLayouts(layouts);
  }

  async probeRecipeRowHeight(recipeIds: string[]) {
    const layout = await this.probeCategoryRecipeLayout(recipeIds);
    return layout.rowStride;
  }

  async translateTag(tagId: string, options?: { baseUrl?: string; locale?: string }) {
    const renderer = await this.ensureReadyForMount(options) as EmiRendererWithIcons;
    if (typeof renderer.translateTag === 'function') {
      return renderer.translateTag(tagId);
    }
    return tagId;
  }
}

export function createEmiRendererClient(): EmiRendererClient {
  return new EmiRendererClientImpl();
}

let clientSingleton: EmiRendererClient | null = null;

export function getEmiRendererClient() {
  if (!clientSingleton) clientSingleton = createEmiRendererClient();
  return clientSingleton;
}
