import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { AppProviders } from './app/providers/AppProviders'
import './index.css'
import 'emi-recipe-renderer/style.css'
import './styles/emi-theme.css'
import { AppBootGate } from './app/ui/AppBootGate'
import { ensureI18nReady } from './shared/i18n/i18n'
import { initThemeFromStorage } from './shared/lib/theme'
import { normalizeSitePath, siteUrl } from './shared/lib/site-base'

initThemeFromStorage()
normalizeSitePath()
document.body.classList.add('is-booting')

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const url = siteUrl('sw.js');
    navigator.serviceWorker.register(url, { scope: siteUrl('') })
      .then(function (reg) {
        if (reg.installing) console.log('[sw] installing');
        else if (reg.waiting) console.log('[sw] waiting (update ready)');
        else if (reg.active) console.log('[sw] active');
      })
      .catch(function (err) {
        console.warn('[sw] registration failed:', err);
      });
  }
}

void ensureI18nReady().then(() => {
  registerServiceWorker();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <AppBootGate>
          <RouterProvider router={appRouter} />
        </AppBootGate>
      </AppProviders>
    </React.StrictMode>,
  )
})
