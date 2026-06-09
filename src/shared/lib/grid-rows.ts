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
