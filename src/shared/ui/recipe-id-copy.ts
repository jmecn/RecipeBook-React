import { copyTextToClipboard } from '../lib/copy-to-clipboard';
import { checkIconMarkup, copyIconMarkup } from './copy-icons';

export const RECIPE_ID_COPY_FEEDBACK_MS = 1200;

export interface RecipeIdCopyLabels {
  copyAria: string;
  copiedAria: string;
}

function setCopyButtonIcon(button: HTMLButtonElement, copied: boolean) {
  const icon = button.querySelector('.recipe-card-copy-icon');
  if (!icon) return;
  icon.innerHTML = copied ? checkIconMarkup() : copyIconMarkup();
  button.classList.toggle('is-copied', copied);
}

export function wireRecipeIdCopyButton(
  button: HTMLButtonElement,
  recipeId: string,
  labels: RecipeIdCopyLabels,
) {
  let resetTimer = 0;

  const showCopied = () => {
    window.clearTimeout(resetTimer);
    button.setAttribute('aria-label', labels.copiedAria);
    button.title = labels.copiedAria;
    setCopyButtonIcon(button, true);
    resetTimer = window.setTimeout(() => {
      button.setAttribute('aria-label', labels.copyAria);
      button.title = labels.copyAria;
      setCopyButtonIcon(button, false);
    }, RECIPE_ID_COPY_FEEDBACK_MS);
  };

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void copyTextToClipboard(recipeId).then((ok) => {
      if (ok) showCopied();
    });
  });
}

export function createRecipeIdCopyButton(
  recipeId: string,
  labels: RecipeIdCopyLabels,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'recipe-card-copy';
  button.setAttribute('aria-label', labels.copyAria);
  button.title = labels.copyAria;
  button.innerHTML = `<span class="recipe-card-copy-icon" aria-hidden="true">${copyIconMarkup()}</span>`;
  wireRecipeIdCopyButton(button, recipeId, labels);
  return button;
}
