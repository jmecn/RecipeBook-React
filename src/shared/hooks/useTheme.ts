import { useCallback, useEffect, useState } from 'react';
import { getEmiRendererClient } from '../../adapters/emi-renderer/client';
import {
  applyTheme,
  getActiveTheme,
  getThemePreference,
  resolveInitialTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
  type Theme,
} from '../lib/theme';

function syncThemeState() {
  return applyTheme(resolveInitialTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme());

  const applySyncedState = useCallback(() => {
    setTheme(syncThemeState());
  }, []);

  useEffect(() => {
    applySyncedState();
  }, [applySyncedState]);

  useEffect(() => {
    getEmiRendererClient().setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      applySyncedState();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applySyncedState]);

  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media || getThemePreference() !== 'auto') return undefined;
    const handler = () => {
      if (getThemePreference() !== 'auto') return;
      setTheme(applyTheme(media.matches ? 'dark' : 'light'));
    };
    try {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } catch {
      media.addListener?.(handler);
      return () => media.removeListener?.(handler);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
    setTheme(applyTheme(next));
  }, []);

  return { theme, toggleTheme };
}
