import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hideEmiTagPopover } from 'emi-recipe-renderer';
import { QueryRouteView } from './QueryRouteView';
import { SiteHeader } from './SiteHeader';
import { EmiOverlays } from './EmiOverlays';
import { LocaleSwitchProvider } from '../context/LocaleSwitchContext';
import '../../styles/site-shell.css';

export function AppLayout() {
  const location = useLocation();

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

  return (
    <LocaleSwitchProvider>
      <div className="app-shell bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader />
        <main id="viewer-main" className="app-main">
          <QueryRouteView />
        </main>
        <EmiOverlays />
      </div>
    </LocaleSwitchProvider>
  );
}
