// Keep in sync with Wiki/ci/lib/tfg-theme.mjs

export const THEME_STORAGE_KEY = 'tfg-theme';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'auto';

function systemTheme(): Theme | null {
  const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  if (!media || typeof media.matches !== 'boolean') return null;
  return media.matches ? 'dark' : 'light';
}

function normalizePreference(value: string | null | undefined): ThemePreference | null {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : null;
}

function normalizeTheme(value: string | null | undefined): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function getThemePreference(): ThemePreference {
  return normalizePreference(readStorageItem(THEME_STORAGE_KEY)) ?? 'auto';
}

export function getStoredTheme(): Theme | null {
  const preference = getThemePreference();
  return preference === 'auto' ? null : preference;
}

export function setThemePreference(preference: ThemePreference) {
  writeStorageItem(THEME_STORAGE_KEY, preference);
}

/** @deprecated Use setThemePreference */
export function setStoredTheme(theme: Theme) {
  setThemePreference(theme);
}

export function resolveInitialTheme(): Theme {
  const preference = getThemePreference();
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
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
