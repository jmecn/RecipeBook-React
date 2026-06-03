interface AppLangTransitionProps {
  visible: boolean;
  status: string;
}

export function AppLangTransition({ visible, status }: AppLangTransitionProps) {
  if (!visible) return null;

  return (
    <div className="app-transition is-visible" role="status" aria-live="polite">
      <div className="app-transition-card">
        <p className="app-transition-status">{status}</p>
        <div className="app-transition-progress" aria-hidden="true">
          <div className="app-transition-progress-fill" />
        </div>
      </div>
    </div>
  );
}
