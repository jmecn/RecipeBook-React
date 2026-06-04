import { useCallback, useEffect, useRef, useState } from 'react';
import { copyTextToClipboard } from '../lib/copy-to-clipboard';
import { CheckIcon, CopyIcon } from './copy-icons';
import { RECIPE_ID_COPY_FEEDBACK_MS, type RecipeIdCopyLabels } from './recipe-id-copy';

interface RecipeIdCopyButtonProps {
  recipeId: string;
  labels: RecipeIdCopyLabels;
  className?: string;
}

export function RecipeIdCopyButton({ recipeId, labels, className }: RecipeIdCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const onCopy = useCallback(() => {
    void copyTextToClipboard(recipeId).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), RECIPE_ID_COPY_FEEDBACK_MS);
    });
  }, [recipeId]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onCopy();
    },
    [onCopy],
  );

  const hint = copied ? labels.copiedAria : labels.copyAria;

  return (
    <button
      type="button"
      className={['recipe-card-copy', copied ? 'is-copied' : '', className].filter(Boolean).join(' ')}
      aria-label={hint}
      title={hint}
      onClick={onClick}
    >
      <span className="recipe-card-copy-icon" aria-hidden="true">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
    </button>
  );
}
