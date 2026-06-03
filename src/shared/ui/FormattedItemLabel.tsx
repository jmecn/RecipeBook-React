import { useEffect, useRef } from 'react';
import { EmiRecipeRenderer } from 'emi-recipe-renderer';

interface FormattedItemLabelProps {
  label: string;
  className?: string;
}

export function FormattedItemLabel({ label, className }: FormattedItemLabelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof EmiRecipeRenderer.setFormattedText === 'function') {
      EmiRecipeRenderer.setFormattedText(el, label);
    } else {
      el.textContent = label.replace(/§./g, '');
    }
  }, [label]);

  return <div ref={ref} className={className} />;
}
