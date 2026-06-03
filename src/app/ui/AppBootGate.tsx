import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { runAppBoot } from '../../shared/boot/run-app-boot';
import { resolveAppLocale } from '../../shared/lib/app-locale';
import { resolveUiMessages } from '../../shared/i18n/messages';
import { AppBootOverlay } from './AppBootOverlay';

const BOOT_TOTAL_STEPS = 9;

export function AppBootGate({ children }: PropsWithChildren) {
  const bootLocale = useMemo(() => resolveAppLocale(), []);
  const [booting, setBooting] = useState(true);
  const [progress, setProgress] = useState(0.05);
  const [status, setStatus] = useState('');
  const startedRef = useRef(false);
  const stepsRef = useRef(0);

  useEffect(() => {
    document.title = resolveUiMessages(bootLocale).appTitle;
  }, [bootLocale]);

  useEffect(() => {
    document.body.classList.toggle('is-booting', booting);
    return () => {
      document.body.classList.remove('is-booting');
    };
  }, [booting]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reportStatus = (message: string) => {
      stepsRef.current = Math.min(BOOT_TOTAL_STEPS, stepsRef.current + 1);
      const ratio = 0.05 + (stepsRef.current / BOOT_TOTAL_STEPS) * 0.9;
      setProgress(ratio);
      setStatus(message);
    };

    void runAppBoot(reportStatus)
      .then(() => {
        setProgress(1);
        setBooting(false);
      })
      .catch((error: unknown) => {
        console.warn('[app-boot] failed', error);
        setProgress(1);
        setBooting(false);
      });
  }, []);

  return (
    <>
      <AppBootOverlay
        locale={bootLocale}
        progress={progress}
        status={status}
        hidden={!booting}
      />
      {!booting ? children : null}
    </>
  );
}
