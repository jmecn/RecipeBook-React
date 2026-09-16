export const SEARCH_HISTORY_KEY = 'tfg-search-history';
export const SEARCH_HISTORY_LIMIT = 10;

export function mergeSearchTerm(history: string[], term: string): string[] {
  const value = String(term || '').trim();
  if (!value) return history;
  const lower = value.toLowerCase();
  const rest = history.filter((item) => item.toLowerCase() !== lower);
  return [value, ...rest].slice(0, SEARCH_HISTORY_LIMIT);
}

export function readSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
      .slice(0, SEARCH_HISTORY_LIMIT);
  } catch {
    // ponytail: storage unavailable (private mode / bad JSON) -> no history
    return [];
  }
}

export function writeSearchHistory(history: string[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ponytail: storage unavailable (private mode / quota) -> memory only
  }
}
