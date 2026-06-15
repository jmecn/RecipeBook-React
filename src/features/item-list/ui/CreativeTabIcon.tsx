import { useEffect, useRef } from 'react';
import { createCreativeTabIconElement, ensureCreativeTabIconStylesheet } from '../lib/creative-tab-icons';

interface CreativeTabIconProps {
  tabId: string;
  baseUrl: string;
  iconsDir: string;
  className?: string;
  size?: 'sm' | 'md';
}

function iconSizeClass(size: 'sm' | 'md') {
  return size === 'sm'
    ? 'creative-tab-picker-icon-slot creative-tab-picker-icon-slot--24'
    : 'creative-tab-picker-icon-slot creative-tab-picker-icon-slot--32';
}

export function CreativeTabIcon({
  tabId,
  baseUrl,
  iconsDir,
  className,
  size = 'md',
}: CreativeTabIconProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !tabId) return;

    let cancelled = false;
    host.replaceChildren();

    void ensureCreativeTabIconStylesheet(baseUrl, iconsDir)
      .then(() => {
        if (cancelled) return;
        host.appendChild(createCreativeTabIconElement(tabId));
      })
      .catch(() => {
        if (cancelled) return;
        host.replaceChildren();
      });

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [baseUrl, iconsDir, tabId]);

  return <span className={className || iconSizeClass(size)} ref={hostRef} />;
}

function AllTabsIcon({ size }: { size: 'sm' | 'md' }) {
  const px = size === 'sm' ? 24 : 32;
  return (
    <svg viewBox="0 0 16 16" width={px} height={px} aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function CreativeTabAllIcon({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={className || `${iconSizeClass(size)} creative-tab-picker-icon-slot--all`}>
      <AllTabsIcon size={size} />
    </span>
  );
}
