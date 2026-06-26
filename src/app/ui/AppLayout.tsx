import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hideEmiTagPopover } from 'emi-recipe-renderer';
import { QueryRouteView } from './QueryRouteView';
import { SiteHeader } from './SiteHeader';
import { EmiOverlays } from './EmiOverlays';
import { LocaleSwitchProvider } from '../context/LocaleSwitchContext';
import { notifyEmbedHeight, parseEmbedContext } from '../../shared/lib/embed';
import '../../styles/site-shell.css';

export function AppLayout() {
  const location = useLocation();
  const embed = parseEmbedContext(location.search);

  useEffect(() => {
    hideEmiTagPopover(document.getElementById('tag-popover'));
  }, [location.search]);

  useEffect(() => {
    const pop = document.getElementById('tag-popover');
    if (!pop) return;
    const onClick = (event: MouseEvent) => {
      if (event.target === pop) hideEmiTagPopover(pop);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideEmiTagPopover(pop);
    };
    pop.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      pop.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-embed', embed.enabled);
    document.body.classList.toggle('is-embed', embed.enabled);
    return () => {
      document.documentElement.classList.remove('is-embed');
      document.body.classList.remove('is-embed');
    };
  }, [embed.enabled]);

  useEffect(() => {
    if (!embed.enabled) {
      return;
    }

    const emitHeight = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
      );
      notifyEmbedHeight(height, embed.frameId);
    };

    emitHeight();
    const observer = new ResizeObserver(emitHeight);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    window.addEventListener('load', emitHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('load', emitHeight);
    };
  }, [embed.enabled, embed.frameId, location.search]);

  return (
    <LocaleSwitchProvider>
      <div className={`app-shell bg-[var(--bg)] text-[var(--text)]${embed.enabled ? ' app-shell--embed' : ''}`}>
        {!embed.enabled ? <SiteHeader /> : null}
        <main id="viewer-main" className="app-main">
          <QueryRouteView />
        </main>
        <EmiOverlays />
      </div>
    </LocaleSwitchProvider>
  );
}
