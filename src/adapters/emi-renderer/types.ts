export interface EmiMountSession {
  disconnect(): void;
  flush(): Promise<void>;
  getStats?(): {
    mounted: number;
    failed: number;
    pending: number;
    total: number;
  };
}

export interface EmiRendererCallbacks {
  onItemClick?: (itemId: string) => void;
  onTagClick?: (tagId: string) => void;
}

export interface EmiRendererInitOptions extends EmiRendererCallbacks {
  baseUrl: string;
  locale: string;
}

export interface EmiMountGridOptions extends EmiRendererInitOptions {
  observeRoot?: Element | null;
  rootMargin?: string;
}

export type EmiRecipeRendererClass = {
  new (options: Record<string, unknown>): EmiRendererInstance;
  mountAll(options: Record<string, unknown>): Promise<EmiMountSession>;
  stripMinecraftFormatting?(text: string): string;
  setFormattedText?(el: HTMLElement, text: string): void;
};

export type EmiRendererInstance = {
  baseUrl: string;
  locale: string;
  onItemClick?: (itemId: string) => void;
  onTagClick?: (tagId: string) => void;
  setBaseUrl(url: string): void;
  setLocale(locale: string): Promise<void>;
  loadIndex(): Promise<unknown>;
  ensureBundle(): Promise<unknown>;
  ensureIconStylesheets(): Promise<void>;
  ensureCategoryIconStylesheets?(): Promise<void>;
  createAtlasSpanForIconKey?(key: string): HTMLElement;
};
