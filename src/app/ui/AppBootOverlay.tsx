import i18n from '../../shared/i18n/i18n';

interface AppBootOverlayProps {
  progress: number;
  status: string;
  hidden: boolean;
}

export function AppBootOverlay({ progress, status, hidden }: AppBootOverlayProps) {
  if (hidden) return null;

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div
      className="app-boot"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-boot-card">
        <p className="app-boot-title">{i18n.t('appTitle')}</p>
        <div className="app-boot-progress" aria-hidden="true">
          <div className="app-boot-progress-fill" style={{ width: `${pct}%` }}>
            <span className="app-boot-progress-gleam" />
          </div>
          <span className="app-boot-progress-track-shimmer" />
        </div>
        {status ? <p className="app-boot-status">{status}</p> : null}
      </div>
    </div>
  );
}
