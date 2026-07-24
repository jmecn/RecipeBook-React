export function formatMaterialAmount(kind: 'item' | 'fluid', amount: number): string {
  if (kind !== 'fluid') return String(amount)
  return amount >= 1000
    ? `${(amount / 1000).toFixed(1)} L`
    : `${amount} mB`
}

export function resolveLabel(labels: Record<string, string>, id: string): string {
  return labels[id] || id
}