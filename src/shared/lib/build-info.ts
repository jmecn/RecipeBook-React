import { fetchJson } from '../api/http';
import { siteUrl } from './site-base';

export interface BuildInfo {
  modpack?: string;
}

export function formatModpackVersion(raw: string | undefined | null): string | null {
  const value = String(raw ?? '').trim().replace(/^v/i, '');
  return value || null;
}

export async function loadBuildInfo(): Promise<BuildInfo | null> {
  return fetchJson<BuildInfo | null>(siteUrl('build.json'), null);
}
