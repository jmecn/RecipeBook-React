# TFG Recipe Viewer

Web viewer for EMI-exported recipe bundles. Built with React, TypeScript, and [emi-recipe-renderer](https://www.npmjs.com/package/emi-recipe-renderer). Routing uses query parameters only (`/` + `?item=`, `?tag=`, `?recipe=`, `?lang=`, `?bundle=`, etc.).

## Prerequisites

- Node.js 24+ (see `.nvmrc`; required by `emi-recipe-renderer`)
- An EMI export bundle under `public/bundles/` (symlink or copy, e.g. `public/bundles/tfg-0.12.8`)

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```