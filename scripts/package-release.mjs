/**
 * After `npm run build`, produce a GitHub Release site tarball and manifest
 * for downstream workflows (e.g. TFG-Recipe-Viewer Deploy Pages).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'release')

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const version = String(pkg.version || '').trim()
if (!version) {
  console.error('[package-release] package.json version is empty')
  process.exit(1)
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[package-release] dist/index.html missing — run npm run build first')
  process.exit(1)
}

let rendererVersion = ''
try {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
  const resolved = lock.packages?.['node_modules/emi-recipe-renderer']?.version
    || lock.dependencies?.['emi-recipe-renderer']?.version
  rendererVersion = resolved ? String(resolved) : ''
} catch {
  // optional
}

const manifest = {
  name: pkg.name,
  version,
  rendererVersion,
  node: fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim(),
  builtAt: new Date().toISOString(),
  /** Extract tarball so index.html is at the deploy root. */
  layout: 'dist-root',
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(distDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

const archiveBase = `tfg-recipe-viewer-site-v${version}`
const tarPath = path.join(outDir, `${archiveBase}.tar.gz`)
const zipPath = path.join(outDir, `${archiveBase}.zip`)

fs.rmSync(tarPath, { force: true })
fs.rmSync(zipPath, { force: true })

execSync(`tar -czf "${tarPath}" -C "${distDir}" .`, { stdio: 'inherit' })
execSync(`cd "${distDir}" && zip -qr "${zipPath}" .`, { stdio: 'inherit' })

console.log(`[package-release] ${tarPath}`)
console.log(`[package-release] ${zipPath}`)
console.log(`[package-release] renderer=${rendererVersion || 'unknown'}`)
