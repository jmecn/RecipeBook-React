import { useEffect, useState } from 'react';

export function useViewerMain() {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const main = document.getElementById('viewer-main');
    setScrollElement(main);
    if (!main) return;

    const update = () => setWidth(main.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  return { scrollElement, width };
}
