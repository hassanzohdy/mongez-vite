---
name: mongez-vite-overview
description: |
  High-level architecture and mental model of the @mongez/vite Vite plugin — what it does, what it bundles, and how its two-phase lifecycle works.
  TRIGGER when: code imports `mongezVite` (default export) or type `MongezViteOptions` from `@mongez/vite`; user asks "what does @mongez/vite do", "how do I set up mongezVite in Vite", "what features does this plugin include"; `vite.config.ts` / `vite.config.js` registers `mongezVite()` in `plugins: []` for the first time, or user wants the lifecycle / scope-boundary picture before diving in.
  SKIP: feature-specific tasks already covered by sibling skills (`mongez-vite-env-loading`, `mongez-vite-env-in-html`, `mongez-vite-production-base-url`, `mongez-vite-tsconfig-aliases`, `mongez-vite-auto-open-browser`, `mongez-vite-build-zip`, `mongez-vite-htaccess`, `mongez-vite-prerender`, `mongez-vite-recipes`); generic Vite plugin authoring not involving `@mongez/vite`; non-Vite bundlers (Webpack, Rollup, esbuild standalone).
---

# Overview

`@mongez/vite` is a Vite plugin that bundles together six small SPA build-time conveniences:

1. **Env file loading** (via `@mongez/dotenv`) — picks the right `.env.<environment>` file per command and loads it with type coercion.
2. **In-HTML env interpolation** — replaces `__KEY__`-style tokens in `index.html` with env values.
3. **Production base URL** — sets `config.base` from a chosen env variable during `vite build`.
4. **tsconfig path mirroring** — copies `compilerOptions.paths` into `resolve.alias` so TS and Vite agree on module resolution.
5. **Auto-open browser** — sets `server.open = true` during `vite dev`.
6. **Post-build artifacts** — emits a zip of the build directory, and optionally a SPA-friendly `.htaccess` and a `prerender.php` for crawler routing.

The package is intentionally narrow:

- Single source folder (`src/`).
- One default export (`mongezVite(options)`) plus a `MongezViteOptions` type.
- Build-time only — no runtime code ships to the browser.

## Install

```sh
yarn add -D @mongez/vite
# peer: vite >= 5.0.0
```

## Import pattern

```ts
// vite.config.ts
import { defineConfig } from "vite";
import mongezVite from "@mongez/vite";
import type { MongezViteOptions } from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      // options
    }),
  ],
});
```

## Mental model

| Concept | Where it lives | What it is |
|---|---|---|
| The plugin object | Return value of `mongezVite()` | A Vite `PluginOption` with `name`, `config`, `transformIndexHtml`, `writeBundle`. |
| The options bag | First arg to `mongezVite` | Per-feature switches. Defaults applied on construction. |
| The env store | `@mongez/dotenv`'s module-level `envData` | Typed env values, populated by `mongezVite` calling `loadEnv`. |
| The `config` hook | Vite calls it once at startup | Mutates the resolved `UserConfig` (server.open, base, resolve.alias, optimizeDeps). |
| `writeBundle` | Vite calls it at end of build | Emits `.htaccess` + zips the output dir. Declared `sequential: true`. |

## Scope boundaries

| Concern | Lives in | Why |
|---|---|---|
| `.env` parsing | `@mongez/dotenv` | One slice — file IO and coercion. |
| Filesystem helpers (`getFile`, `putFile`, `moveFile`) | `@mongez/fs` | Used to read tsconfig + write `.htaccess`. |
| ANSI colors for build logs | `@mongez/copper` | Cosmetic. |
| Bundle / chunk / asset transforms | Vite itself | Use vite's plugin API directly for per-asset work. |
| Service worker / PWA / image optimisation | Separate vite plugins | Out of scope. |
| Runtime state, hooks, queries | `@mongez/atom`, `@mongez/react-atom`, `@mongez/atomic-query` | Unrelated; this is build-time only. |

## Behavioural defaults

| Option | Default | Why |
|---|---|---|
| `autoOpenBrowser` | `true` | Quality-of-life — most SPA devs want this. |
| `linkTsconfigPaths` / `tsconfigAlias` | `true` | Keeps TS + Vite in sync without a second plugin. |
| `compressBuild` | `true` | "vite build" → "scp the zip" is a common Mongez deploy. |
| `htaccess` | `false` | Apache-specific — defaults off. |
| `preRender` | `false` | Requires an external service — opt in. |
| `envBaseUrlKey` | `"PUBLIC_URL"` | Convention from CRA / Next.js. |
| `htmlEnvPrefix` / `htmlEnvSuffix` | `"__"` | Visible at a glance, doesn't trip URL parsers. |

## The two-phase lifecycle

```
mongezVite()
   │
   ├─ config hook (Vite calls once)
   │    │
   │    ├─ resolveAutoOpenBrowser  (server.open)
   │    ├─ resolveTsConfigAlias     (resolve.alias)
   │    ├─ resolveEnvironmentVariables (loadEnv → @mongez/dotenv store)
   │    └─ resolveOtherConfig       (config.base, optimizeDeps)
   │
   ├─ transformIndexHtml (per HTML file Vite emits)
   │    └─ replace __KEY__ tokens
   │
   └─ writeBundle (Vite calls once after build)
        ├─ generateHtaccess  (emit .htaccess + prerender.php)
        └─ compressBuild     (zip the output dir)
```

The `config` hook is where most of the work happens — by the time it returns, the resolved Vite config has `server.open`, `config.base`, `resolve.alias`, and `optimizeDeps` filled in (when the user didn't already set them).
