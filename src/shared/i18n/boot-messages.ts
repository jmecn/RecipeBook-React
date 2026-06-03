import { uiLocale } from './messages';

const BOOT_TEXT = {
  en_us: {
    bootReadingConfig: 'Loading site config...',
    bootLoadingBundle: 'Loading bundle...',
    bootLoadingLang: 'Loading languages...',
    bootLoadingIcons: 'Loading icons...',
    bootWarmingAtlas: 'Warming icon atlases...',
    bootLoadingItemsIndex: 'Loading items index...',
    bootLoadingSearch: 'Loading item search index...',
    bootApplyingIconStyles: 'Applying icon styles...',
    bootEntering: 'Entering...{cachedHint}',
    cacheHint: ' (cached)',
  },
  zh_cn: {
    bootReadingConfig: '正在读取站点配置…',
    bootLoadingBundle: '正在加载 bundle…',
    bootLoadingLang: '正在加载语言…',
    bootLoadingIcons: '正在加载图标…',
    bootWarmingAtlas: '正在预热图标图集…',
    bootLoadingItemsIndex: '正在加载物品索引…',
    bootLoadingSearch: '正在加载物品搜索索引…',
    bootApplyingIconStyles: '正在应用图标样式…',
    bootEntering: '正在进入…{cachedHint}',
    cacheHint: '（已缓存）',
  },
} as const;

export function bootText(
  locale: string,
  key: string,
  vars?: Record<string, string>,
) {
  const lang = uiLocale(locale);
  let text: string =
    BOOT_TEXT[lang]?.[key as keyof typeof BOOT_TEXT.en_us]
    ?? BOOT_TEXT.en_us[key as keyof typeof BOOT_TEXT.en_us]
    ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(value);
    }
  }
  return text;
}
