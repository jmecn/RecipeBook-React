const THEME_STORAGE_KEY = 'recipeViewerTheme';

export type Theme = 'light' | 'dark';

function systemTheme(): Theme | null {
  const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  if (!media || typeof media.matches !== 'boolean') return null;
  return media.matches ? 'dark' : 'light';
}

function normalizeTheme(value: string | null | undefined): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function getStoredTheme(): Theme | null {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

export function resolveInitialTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return systemTheme() || 'dark';
}

export function getActiveTheme(): Theme {
  return normalizeTheme(document.documentElement.dataset.theme) || resolveInitialTheme();
}

export function applyTheme(theme: Theme) {
  const value = normalizeTheme(theme) || resolveInitialTheme();
  document.documentElement.dataset.theme = value;
  return value;
}

export function initThemeFromStorage() {
  return applyTheme(resolveInitialTheme());
}

export { THEME_STORAGE_KEY };
