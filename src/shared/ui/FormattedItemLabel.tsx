import { useEffect, useRef } from 'react';
import { applyMinecraftFormattedClasses, hasMinecraftFormatting } from '../lib/minecraft-text';

interface FormattedItemLabelProps {
  label: string;
  className?: string;
}

export function FormattedItemLabel({ label, className }: FormattedItemLabelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (hasMinecraftFormatting(label)) {
      applyMinecraftFormattedClasses(el, label);
    } else {
      el.textContent = label;
    }
  }, [label]);

  return <div ref={ref} className={className} />;
}
