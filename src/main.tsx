import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { AppProviders } from './app/providers/AppProviders'
import './index.css'
import 'emi-recipe-renderer/style.css'
import './styles/emi-theme.css'
import { AppBootGate } from './app/ui/AppBootGate'
import { initThemeFromStorage } from './shared/lib/theme'
import { normalizeSitePath } from './shared/lib/site-base'

initThemeFromStorage()
normalizeSitePath()
document.body.classList.add('is-booting')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppBootGate>
        <RouterProvider router={appRouter} />
      </AppBootGate>
    </AppProviders>
  </React.StrictMode>,
)
