import { useQuery } from '@tanstack/react-query';
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http';

interface TagsIndex {
  items?: string[];
  blocks?: string[];
  fluids?: string[];
}

interface TagJson {
  values?: string[];
}

function tagPath(kind: 'items' | 'blocks' | 'fluids', tagId: string) {
  const sep = tagId.indexOf(':');
  if (sep <= 0 || sep >= tagId.length - 1) return '';
  const ns = tagId.slice(0, sep);
  const path = tagId.slice(sep + 1);
  return `tags/${ns}/${kind}/${path}.json`;
}

function parseTagMembers(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((value): value is string => typeof value === 'string');
  }
  if (data && typeof data === 'object' && Array.isArray((data as TagJson).values)) {
    return (data as TagJson).values!.filter((value): value is string => typeof value === 'string');
  }
  return [];
}

export function useTagDetailQuery(bundleId: string, tagId: string) {
  return useQuery({
    queryKey: ['tag-detail', bundleId, tagId],
    enabled: Boolean(bundleId && tagId),
    queryFn: async () => {
      const baseUrl = bundleBaseUrl(bundleId);
      const kinds: Array<'items' | 'blocks' | 'fluids'> = ['items', 'blocks', 'fluids'];
      const index = await fetchJson<TagsIndex>(`${baseUrl}tags/index.json`, {});

      for (const kind of kinds) {
        const path = tagPath(kind, tagId);
        if (!path) continue;
        const inIndex = (index[kind] || []).includes(tagId);
        if (!inIndex) {
          const direct = await fetchJson<TagJson | string[] | null>(`${baseUrl}${path}`, null);
          const members = parseTagMembers(direct);
          if (members.length > 0) return { kind, path, members };
          continue;
        }
        const data = await fetchJson<TagJson | string[] | null>(`${baseUrl}${path}`, null);
        const members = parseTagMembers(data);
        if (members.length > 0 || data) return { kind, path, members };
      }
      return null;
    },
  });
}

export function tagMemberRows(kind: 'items' | 'blocks' | 'fluids', members: string[]) {
  return members.map((raw) => ({
    raw,
    isItem: kind === 'items' && !raw.startsWith('#'),
    id: raw.replace(/^#/, ''),
  }));
}
