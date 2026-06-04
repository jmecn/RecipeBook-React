import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

const localeJsonPath = /^\/locales\/([a-z]{2}_[a-z]{2})\.json$/i

function localeJson404Middleware(
  localesDir: string,
): Connect.NextHandleFunction {
  return (req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0] ?? ''
    const match = localeJsonPath.exec(pathname)
    if (!match || (req.method ?? 'GET') !== 'GET') {
      next()
      return
    }

    const filePath = path.join(localesDir, `${match[1].toLowerCase()}.json`)
    if (fs.existsSync(filePath)) {
      next()
      return
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end('{}')
  }
}

/** Prevent SPA index.html fallback for missing UI locale files (dev + preview). */
export function localeJson404Plugin(localesDir: string): Plugin {
  const attach = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use(localeJson404Middleware(localesDir))
  }

  return {
    name: 'locale-json-404',
    enforce: 'pre',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
