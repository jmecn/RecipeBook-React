import fs from 'node:fs'
import path from 'node:path'

const localesDir = path.resolve('public/locales')
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true })
}

const locales = fs
  .readdirSync(localesDir)
  .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
  .map((name) => name.replace(/\.json$/, ''))
  .sort()

const manifestPath = path.join(localesDir, 'manifest.json')
fs.writeFileSync(manifestPath, `${JSON.stringify(locales, null, 2)}\n`)
console.log(`[sync-locale-manifest] ${locales.join(', ')}`)
