import { EmiRecipeRenderer } from 'emi-recipe-renderer';
import {
  RECIPE_CARD_PADDING_Y,
  RECIPE_GRID_ROW_GAP,
  VIRTUAL_ROW_HEIGHT,
} from './recipe-meta';

export interface CategoryRecipeLayout {
  stageWidth: number;
  stageHeight: number;
  rowStride: number;
  /** Full card width incl. padding + border — used for column count. */
  cardOuterWidth: number;
}

export const FALLBACK_CATEGORY_LAYOUT: CategoryRecipeLayout = {
  stageWidth: 280,
  stageHeight: 160,
  rowStride: VIRTUAL_ROW_HEIGHT,
  cardOuterWidth: 302,
};

const RECIPE_CARD_CHROME_X = 22;

export function rowStrideFromMeta(
  meta: { width?: number; height?: number; margin?: number },
  imageScale = 2,
): CategoryRecipeLayout {
  const size = EmiRecipeRenderer.displaySizeFromMeta(meta, imageScale);
  const rowStride = Math.ceil(size.height + RECIPE_CARD_PADDING_Y + RECIPE_GRID_ROW_GAP);
  return {
    stageWidth: size.width,
    stageHeight: size.height,
    rowStride: Math.max(VIRTUAL_ROW_HEIGHT, Math.min(720, rowStride)),
    cardOuterWidth: size.width + RECIPE_CARD_CHROME_X,
  };
}

export function mergeCategoryLayouts(layouts: CategoryRecipeLayout[]): CategoryRecipeLayout {
  if (layouts.length === 0) return FALLBACK_CATEGORY_LAYOUT;
  return layouts.reduce((best, next) => ({
    stageWidth: Math.max(best.stageWidth, next.stageWidth),
    stageHeight: Math.max(best.stageHeight, next.stageHeight),
    rowStride: Math.max(best.rowStride, next.rowStride),
    cardOuterWidth: Math.max(best.cardOuterWidth, next.cardOuterWidth),
  }));
}
