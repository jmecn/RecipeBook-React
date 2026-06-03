import { useCallback, useEffect, useState } from 'react';
import { getEmiRendererClient } from '../../adapters/emi-renderer/client';
import {
  applyTheme,
  getActiveTheme,
  getStoredTheme,
  resolveInitialTheme,
  setStoredTheme,
  type Theme,
} from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme());

  useEffect(() => {
    setTheme(applyTheme(resolveInitialTheme()));
  }, []);

  useEffect(() => {
    getEmiRendererClient().setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media || getStoredTheme()) return undefined;
    const handler = () => {
      if (getStoredTheme()) return;
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
    setStoredTheme(next);
    setTheme(applyTheme(next));
  }, []);

  return { theme, toggleTheme };
}
