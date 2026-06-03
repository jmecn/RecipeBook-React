/** Copy small site manifests into dist/ (bundle payload stays outside dist). */
import fs from 'node:fs'
import path from 'node:path'

const publicDir = path.resolve('public')
const outDir = path.resolve('dist')

if (!fs.existsSync(outDir)) {
  console.error('[copy-public-static] dist/ missing — run vite build first')
  process.exit(1)
}

for (const entry of fs.readdirSync(publicDir)) {
  if (entry === 'bundles') continue
  const src = path.join(publicDir, entry)
  const dest = path.join(outDir, entry)
  fs.cpSync(src, dest, { recursive: true })
}
