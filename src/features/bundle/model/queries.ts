import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';
import { siteUrl } from '../../../shared/lib/site-base';

interface BundlesManifest {
  default?: string;
  bundles?: string[];
}

export interface BundleMeta {
  languages?: string[];
}

export function useBundlesManifestQuery() {
  return useQuery({
    queryKey: ['bundles-manifest'],
    queryFn: () => fetchJson<BundlesManifest>(siteUrl('bundles.json'), { default: undefined, bundles: [] }),
  });
}

export function useBundleMetaQuery(bundleId: string) {
  return useQuery({
    queryKey: ['bundle-meta', bundleId],
    queryFn: () => fetchJson<BundleMeta>(`${bundleBaseUrl(bundleId)}bundle.json`, { languages: ['en_us'] }),
    enabled: Boolean(bundleId),
    staleTime: Infinity,
  });
}
