import type { CategoryRecipeLayout } from './category-recipe-layout';

export function createRecipeCardElement(
  recipeId: string,
  layout: CategoryRecipeLayout | null,
): HTMLElement {
  const article = document.createElement('article');
  article.className = 'recipe-card';
  article.dataset.recipeId = recipeId;

  const stage = document.createElement('div');
  stage.className = 'emi-recipe emi-recipe-pending recipe-card-stage';
  stage.dataset.recipeId = recipeId;
  applyStageSkeletonSize(stage, layout);

  const idEl = document.createElement('p');
  idEl.className = 'recipe-card-id';
  idEl.title = recipeId;
  idEl.textContent = recipeId;

  article.append(stage, idEl);
  return article;
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
}): string[] {
  const { container, topSpacer, bottomSpacer, windowIds, cardPool, layout } = options;
  const wantSet = new Set(windowIds);

  for (const [recipeId, card] of cardPool) {
    if (!wantSet.has(recipeId)) {
      card.remove();
    }
  }

  let anchor: Element = topSpacer;
  for (const recipeId of windowIds) {
    let card = cardPool.get(recipeId);
    if (!card) {
      card = createRecipeCardElement(recipeId, layout);
      cardPool.set(recipeId, card);
    } else {
      const stage = card.querySelector('.recipe-card-stage') as HTMLElement | null;
      if (stage) applyStageSkeletonSize(stage, layout);
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
