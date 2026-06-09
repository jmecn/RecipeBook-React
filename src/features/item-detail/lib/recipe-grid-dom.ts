import type { CategoryRecipeLayout } from './category-recipe-layout';
import { createRecipeIdCopyButton, type RecipeIdCopyLabels } from '../../../shared/ui/recipe-id-copy';

export interface RecipeCardOptions {
  showId?: boolean;
  onIdClick?: (recipeId: string) => void;
  copyLabels?: RecipeIdCopyLabels;
}

function appendRecipeFooter(article: HTMLElement, recipeId: string, options?: RecipeCardOptions) {
  if (options?.showId === false) return;

  const footer = document.createElement('div');
  footer.className = 'recipe-card-footer';

  const onIdClick = options?.onIdClick;
  let idEl: HTMLElement;
  if (onIdClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recipe-card-id recipe-card-id--link';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onIdClick(recipeId);
    });
    idEl = button;
  } else {
    idEl = document.createElement('p');
    idEl.className = 'recipe-card-id';
  }
  idEl.title = recipeId;
  idEl.textContent = recipeId;
  footer.append(idEl);

  if (options?.copyLabels) {
    footer.append(createRecipeIdCopyButton(recipeId, options.copyLabels));
  }

  article.append(footer);
}

export function createRecipeCardElement(
  recipeId: string,
  layout: CategoryRecipeLayout | null,
  options?: RecipeCardOptions,
): HTMLElement {
  const article = document.createElement('article');
  article.className = 'recipe-card';
  article.dataset.recipeId = recipeId;

  const stage = document.createElement('div');
  stage.className = 'emi-recipe emi-recipe-pending recipe-card-stage';
  stage.dataset.recipeId = recipeId;
  applyStageSkeletonSize(stage, layout);

  article.append(stage);
  appendRecipeFooter(article, recipeId, options);
  return article;
}

export function updateRecipeCardFooter(
  article: HTMLElement,
  recipeId: string,
  options?: RecipeCardOptions,
) {
  article.querySelector('.recipe-card-footer')?.remove();
  appendRecipeFooter(article, recipeId, options);
}

export function applyStageSkeletonSize(
  stage: HTMLElement,
  layout: CategoryRecipeLayout | null,
) {
  if (!layout) return;
  stage.style.width = `${layout.stageWidth}px`;
  stage.style.minWidth = `${layout.stageWidth}px`;
  stage.style.minHeight = `${layout.stageHeight}px`;
  stage.style.boxSizing = 'border-box';
}

export function patchRecipeGridDom(options: {
  container: HTMLElement;
  topSpacer: HTMLElement;
  bottomSpacer: HTMLElement;
  windowIds: string[];
  cardPool: Map<string, HTMLElement>;
  layout: CategoryRecipeLayout | null;
  recipeCardOptions?: RecipeCardOptions;
}): string[] {
  const { container, topSpacer, bottomSpacer, windowIds, cardPool, layout, recipeCardOptions } = options;
  const wantSet = new Set(windowIds);

  for (const [recipeId, card] of cardPool) {
    if (!wantSet.has(recipeId)) {
      card.remove();
      cardPool.delete(recipeId);
    }
  }

  let anchor: Element = topSpacer;
  for (const recipeId of windowIds) {
    let card = cardPool.get(recipeId);
    if (!card) {
      card = createRecipeCardElement(recipeId, layout, recipeCardOptions);
      cardPool.set(recipeId, card);
    } else {
      const stage = card.querySelector('.recipe-card-stage') as HTMLElement | null;
      if (stage) applyStageSkeletonSize(stage, layout);
      updateRecipeCardFooter(card, recipeId, recipeCardOptions);
    }

    const next = anchor.nextElementSibling;
    if (next !== card) {
      anchor.insertAdjacentElement('afterend', card);
    }
    anchor = card;
  }

  if (bottomSpacer.parentElement !== container) {
    container.appendChild(bottomSpacer);
  } else if (anchor.nextElementSibling !== bottomSpacer) {
    bottomSpacer.remove();
    container.appendChild(bottomSpacer);
  }

  return windowIds.filter((recipeId) => {
    const card = cardPool.get(recipeId);
    const stage = card?.querySelector('.recipe-card-stage[data-recipe-id]') as HTMLElement | undefined;
    return !stage || stage.dataset.emiMounted !== '1';
  });
}

export function clearRecipeGridDom(
  container: HTMLElement,
  cardPool: Map<string, HTMLElement>,
) {
  for (const card of cardPool.values()) {
    card.remove();
  }
  cardPool.clear();
  container.querySelectorAll(':scope > .recipe-card').forEach((node) => node.remove());
}
