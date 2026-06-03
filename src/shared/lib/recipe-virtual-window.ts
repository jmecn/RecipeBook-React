import {
  VIRTUAL_BUFFER_ROWS,
  VIRTUAL_MAX_WINDOW_ITEMS,
} from '../../features/item-detail/lib/recipe-meta';

export function scrollViewportHeight(scrollEl: HTMLElement) {
  const rect = scrollEl.getBoundingClientRect();
  const client = scrollEl.clientHeight;
  const maxReasonable = Math.max(
    320,
    window.innerHeight - Math.max(0, rect.top) - 16,
  );
  if (client > 0 && client <= maxReasonable * 1.2) return client;
  const fromRect = rect.height;
  if (fromRect > 0 && fromRect <= maxReasonable * 1.2) return fromRect;
  return maxReasonable;
}

export function offsetTopInScrollParent(el: HTMLElement, scrollParent: HTMLElement) {
  return el.getBoundingClientRect().top
    - scrollParent.getBoundingClientRect().top
    + scrollParent.scrollTop;
}

export interface RecipeVirtualWindow {
  windowIds: string[];
  startRow: number;
  endRow: number;
  totalRows: number;
  startIndex: number;
  endIndex: number;
}

export function computeRecipeVirtualWindow(options: {
  recipeIds: string[];
  scrollEl: HTMLElement;
  containerTop: number;
  rowHeight: number;
  columnCount: number;
}): RecipeVirtualWindow | null {
  const { recipeIds, scrollEl, containerTop, rowHeight, columnCount } = options;
  const cols = Math.max(1, columnCount);
  if (!recipeIds.length || rowHeight <= 0) return null;

  const totalRows = Math.ceil(recipeIds.length / cols);
  const viewportHeight = scrollViewportHeight(scrollEl);

  const viewTop = Math.max(0, scrollEl.scrollTop - containerTop);
  const viewBottom = viewTop + viewportHeight;

  let startRow = Math.max(0, Math.floor(viewTop / rowHeight) - VIRTUAL_BUFFER_ROWS);
  startRow = Math.min(startRow, Math.max(0, totalRows - 1));

  let endRow = Math.min(
    totalRows - 1,
    Math.ceil(viewBottom / rowHeight) + VIRTUAL_BUFFER_ROWS,
  );
  const maxRowsInWindow = Math.ceil(VIRTUAL_MAX_WINDOW_ITEMS / cols) + VIRTUAL_BUFFER_ROWS * 2;
  endRow = Math.min(endRow, startRow + maxRowsInWindow - 1);
  endRow = Math.max(endRow, startRow);

  const startIndex = Math.max(0, Math.min(recipeIds.length, startRow * cols));
  let endIndex = Math.min(recipeIds.length, (endRow + 1) * cols);
  if (startIndex >= recipeIds.length) {
    return {
      windowIds: [],
      startRow,
      endRow,
      totalRows,
      startIndex: recipeIds.length,
      endIndex: recipeIds.length,
    };
  }
  if (endIndex <= startIndex) {
    endIndex = Math.min(recipeIds.length, startIndex + cols);
  }
  if (endIndex - startIndex > VIRTUAL_MAX_WINDOW_ITEMS) {
    endIndex = startIndex + VIRTUAL_MAX_WINDOW_ITEMS;
    endRow = Math.min(totalRows - 1, Math.ceil(endIndex / cols) - 1);
  }

  return {
    windowIds: recipeIds.slice(startIndex, endIndex),
    startRow,
    endRow,
    totalRows,
    startIndex,
    endIndex,
  };
}

export function syncRecipeGridSpacers(options: {
  container: HTMLElement;
  topSpacer: HTMLElement;
  bottomSpacer: HTMLElement;
  startRow: number;
  endRow: number;
  totalRows: number;
  rowStride: number;
}) {
  const { container, topSpacer, bottomSpacer, startRow, endRow, totalRows, rowStride } = options;
  const virtualTotal = totalRows * rowStride;
  const topHeight = startRow * rowStride;
  topSpacer.style.height = `${topHeight}px`;

  const virtualMiddle = Math.max(rowStride, (endRow - startRow + 1) * rowStride);
  const cards = [...container.querySelectorAll(':scope > .recipe-card')] as HTMLElement[];
  let cardsHeight = virtualMiddle;
  if (cards.length > 0) {
    const firstTop = cards[0].offsetTop;
    const last = cards[cards.length - 1];
    cardsHeight = Math.max(virtualMiddle, last.offsetTop + last.offsetHeight - firstTop);
  }

  const bottomHeight = Math.max(0, virtualTotal - topHeight - cardsHeight);
  bottomSpacer.style.height = `${bottomHeight}px`;
  container.style.minHeight = `${Math.max(virtualTotal, topHeight + cardsHeight + bottomHeight)}px`;
}
