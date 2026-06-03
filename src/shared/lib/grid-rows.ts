export const RECIPE_GRID_COL_WIDTH = 340;

export function chunkIntoRows<T>(items: T[], columnCount: number): T[][] {
  const cols = Math.max(1, columnCount);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export function getItemGridColumnCount(viewportWidth: number) {
  const w = Math.max(0, viewportWidth);
  if (w <= 520) return 1;
  if (w <= 720) return 2;
  if (w <= 940) return 3;
  if (w <= 1180) return 4;
  if (w <= 1400) return 5;
  return 6;
}

export function getRecipeGridColumnCountFromLayout(
  containerWidth: number,
  fallbackWidth: number,
  cardOuterWidth: number,
  gap = 12,
) {
  const stride = Math.max(1, cardOuterWidth + gap);
  const measured = Math.max(0, containerWidth);
  if (measured >= stride * 0.5) {
    return Math.max(1, Math.floor((measured + gap) / stride));
  }
  const fallback = Math.max(0, fallbackWidth - 28);
  if (fallback >= stride * 0.5) {
    return Math.max(1, Math.floor((fallback + gap) / stride));
  }
  return 3;
}

export function getRecipeGridColumnCount(containerWidth: number, fallbackWidth = 0) {
  return getRecipeGridColumnCountFromLayout(containerWidth, fallbackWidth, RECIPE_GRID_COL_WIDTH);
}
