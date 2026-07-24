import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localeJson404Plugin } from './vite-locale-json-404'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(rootDir, 'public/locales')

export default defineConfig({
  base: './',
  plugins: [localeJson404Plugin(localesDir), react()],
  server: {
    allowedHosts: ['emi.jmecn.net'],
    watch: {
      ignored: ['**/public/bundles/**'],
    },
  },
  build: {
    copyPublicDir: false,
    reportCompressedSize: false,
  },
})
