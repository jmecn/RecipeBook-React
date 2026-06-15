export function creativeTabDisplayLabel(
  tabId: string,
  nameKey: string | undefined,
  lang: Record<string, string> | undefined,
) {
  if (nameKey && lang?.[nameKey]) {
    return lang[nameKey];
  }
  const tail = tabId.includes(':') ? tabId.split(':')[1] : tabId;
  return tail.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
