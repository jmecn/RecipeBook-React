export function buildPageRange(current: number, total: number, radius = 2): Array<number | '…'> {
  if (total <= 1) return [1];
  const pages = new Set([1, total]);
  for (let i = current - radius; i <= current + radius; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) out.push('…');
    out.push(page);
    prev = page;
  }
  return out;
}
