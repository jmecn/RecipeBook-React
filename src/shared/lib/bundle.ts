export function resolveBundleId(bundleToken: string, defaultBundle?: string) {
  if (bundleToken && bundleToken !== '_') return bundleToken;
  if (defaultBundle && defaultBundle.trim()) return defaultBundle.trim();
  return '';
}
