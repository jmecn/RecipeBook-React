import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // `public/bundles/` is a local symlink to EMI export data — do not copy into dist on build.
    copyPublicDir: false,
    reportCompressedSize: false,
  },
})
