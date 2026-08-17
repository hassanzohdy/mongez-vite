---
name: mongez-vite-overview
description: |
  @mongez/vite — Vite plugin suite for SPAs. Typed env loading, in-HTML env interpolation, tsconfig path mirroring, auto-open dev server, production base URL, post-build zip, .htaccess generation, pre-render integration. Build-time only.
---

# @mongez/vite — Overview

A Vite plugin suite that bundles **six SPA build-time conveniences** into one install. Typed env loading with NODE_ENV resolution, in-HTML env interpolation, tsconfig path mirroring, auto-open dev server, production base URL, post-build zip — plus optional `.htaccess` generation and pre-render integration. Build-time only; **no runtime code ships to the browser**.

## Highlighted features

<div class="mongez-highlights">

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  <h3>Typed env loading</h3>
  <p>Reads <code>.env.&lt;environment&gt;</code> via <code>@mongez/dotenv</code> — gets numbers, booleans, <code>null</code> as real primitives, not strings.</p>
</div>

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  <h3>In-HTML env interpolation</h3>
  <p><code>&lt;title&gt;__APP_NAME__&lt;/title&gt;</code> in <code>index.html</code> → replaced at build time with the env value. Customisable prefix/suffix.</p>
</div>

<div class="mongez-highlight" data-accent="fire">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  <h3>tsconfig path mirroring</h3>
  <p>Copies <code>compilerOptions.paths</code> into <code>resolve.alias</code> automatically — TypeScript and Vite always agree on module resolution.</p>
</div>

<div class="mongez-highlight" data-accent="fire">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
  <h3>Production base URL</h3>
  <p>Reads <code>PUBLIC_URL</code> (or your chosen env key) during <code>vite build</code> and sets <code>config.base</code>. Deploy to subpaths without per-environment config files.</p>
</div>

<div class="mongez-highlight" data-accent="bolt">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  <h3>Post-build zip + <code>.htaccess</code></h3>
  <p>Optional zip of <code>dist/</code> for deploy, optional Apache SPA fallback rules — "vite build" → "scp the zip" works without extra glue.</p>
</div>

<div class="mongez-highlight" data-accent="bolt">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
  <h3>Pre-render integration</h3>
  <p>Route crawlers (Google, FB scrapers) to your pre-render service via <code>prerender.php</code>. Same SEO win as SSR without the SSR framework.</p>
</div>

</div>

## Install

```sh
npm install -D @mongez/vite
# or: yarn add -D @mongez/vite
# or: pnpm add -D @mongez/vite
```

Peer dep: `vite >= 5.0.0`. Install as a **dev dependency** — `@mongez/vite` is build-time only.

## Quick peek

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      htaccess: true,                              // emit Apache SPA fallback rules
      preRender: { url: "https://render.io" },     // route crawlers to a prerender service
    }),
    react(),
  ],
});
```

Register the plugin in `vite.config.ts`. The default profile turns on env loading, HTML interpolation, tsconfig aliases, auto-open dev, production base URL, and post-build zip — all driven by your `.env.<environment>` files.

## Behavioural defaults

| Option | Default | Why |
|---|---|---|
| `autoOpenBrowser` | `true` | Quality-of-life — most SPA devs want this |
| `linkTsconfigPaths` / `tsconfigAlias` | `true` | Keeps TS + Vite in sync without a second plugin |
| `compressBuild` | `true` | `vite build` → `scp the zip` is a common Mongez deploy |
| `htaccess` | `false` | Apache-specific — defaults off |
| `preRender` | `false` | Requires an external service — opt in |
| `envBaseUrlKey` | `"PUBLIC_URL"` | Convention from CRA / Next.js |
| `htmlEnvPrefix` / `htmlEnvSuffix` | `"__"` | Visible at a glance, doesn't trip URL parsers |

## The two-phase lifecycle

```
mongezVite()
   │
   ├─ config hook (Vite calls once)
   │    ├─ resolveAutoOpenBrowser         (server.open)
   │    ├─ resolveTsConfigAlias            (resolve.alias)
   │    ├─ resolveEnvironmentVariables     (loadEnv → @mongez/dotenv store)
   │    └─ resolveOtherConfig              (config.base, optimizeDeps)
   │
   ├─ transformIndexHtml (per HTML file Vite emits)
   │    └─ replace __KEY__ tokens
   │
   └─ writeBundle (Vite calls once after build)
        ├─ generateHtaccess   (emit .htaccess + prerender.php)
        └─ compressBuild      (zip the output dir)
```

The `config` hook does most of the work. By the time it returns, the resolved Vite config has `server.open`, `config.base`, `resolve.alias`, and `optimizeDeps` filled in (when the user didn't already set them).

## Scope boundaries

| Concern | Lives in | Why |
|---|---|---|
| `.env` parsing | [`@mongez/dotenv`](/dotenv/overview/) | One slice — file IO and coercion |
| Bundle / chunk / asset transforms | Vite itself | Use Vite's plugin API directly |
| Service worker / PWA / image optimisation | Separate Vite plugins | Out of scope |
| Runtime state, hooks, queries | [`@mongez/atom`](/atom/overview/) family | Unrelated; this is build-time only |

## Where to go next

- **[Env loading](../env-loading/)** — `.env.<environment>` resolution, type coercion
- **[Env in HTML](../env-in-html/)** — `__KEY__` interpolation rules
- **[Production base URL](../production-base-url/)** — `envBaseUrlKey`, when the plugin does NOT touch `config.base`
- **[tsconfig aliases](../tsconfig-aliases/)** — path mirroring
- **[Auto-open browser](../auto-open-browser/)** — when the plugin does nothing
- **[Build ZIP](../build-zip/)** — zip emission, output paths
- **[.htaccess](../htaccess/)** — Apache SPA fallback rules
- **[Prerender](../prerender/)** — crawler routing setup
- **[Recipes](../recipes/)** — common patterns
