export function canonicalItemId(id: string) {
  if (!id) return id;
  let s = String(id);
  const brace = s.indexOf('{');
  if (brace >= 0) s = s.slice(0, brace);
  const at = s.indexOf('@');
  if (at >= 0) s = s.slice(0, at);
  return s;
}

export function normalizedFilterQuery(input: string) {
  return String(input || '').trim().toLowerCase();
}
