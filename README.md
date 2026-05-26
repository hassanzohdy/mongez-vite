<div align="center">

# @mongez/vite

**Curated bundle of Vite plugins for SPA workflows — typed env loading, `index.html` interpolation, tsconfig path mirroring, auto-open dev server, post-build `.zip`, `.htaccess` generation, prerender routing, and production base URL — all from one plugin call.**

[![npm](https://img.shields.io/npm/v/@mongez/vite.svg)](https://www.npmjs.com/package/@mongez/vite)
[![license](https://img.shields.io/npm/l/@mongez/vite.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mongez/vite.svg)](https://bundlephobia.com/package/@mongez/vite)
[![downloads](https://img.shields.io/npm/dw/@mongez/vite.svg)](https://www.npmjs.com/package/@mongez/vite)

</div>

---

## Why @mongez/vite?

A typical Vite SPA wants the same handful of build-time conveniences on every project: load `.env.production` for `vite build` and `.env.development` for `vite dev`, inject env values into `index.html`, mirror `tsconfig.json` paths into `resolve.alias`, open the browser on dev start, set `config.base` from a CDN env variable during build, zip the build directory for shipping, write a SPA-friendly `.htaccess`, and route crawler traffic through a prerender service — and you end up reaching for `dotenv-flow-vite` + `vite-plugin-zip` + `vite-tsconfig-paths` + a hand-rolled `transformIndexHtml` + a hand-rolled `writeBundle` every time.

`@mongez/vite` is a curated bundle of those eight Vite plugins, exposed as one default export, each independently opt-in via the options bag. Defaults are on for SPA dev (`autoOpenBrowser`, `linkTsconfigPaths`, `compressBuild`); off for SPA prod-ops (`htaccess`, `preRender`). The whole package is build-time only — no runtime code ships to the browser.

```ts
import { defineConfig } from "vite";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      htaccess: true,
      preRender: { url: "https://render.mentoor.io" },
    }),
  ],
});
```

---

## Features

| Plugin | What it does |
|---|---|
| **Env loading** | Picks the right `.env.<environment>` file per Vite command via `@mongez/dotenv` — `.env.production` for `vite build`, `.env.development` for `vite dev`, with `.env.shared` layered underneath. |
| **Env-in-HTML interpolation** | Replaces `__KEY__`-style tokens in every emitted `index.html` with env values via a `transformIndexHtml` hook. Delimiters are customisable. |
| **tsconfig path aliases** | Reads `compilerOptions.paths` from `tsconfig.json` and mirrors them into `resolve.alias` so `tsc` and Vite agree on module resolution. |
| **Auto-open browser** | Sets `server.open = true` during `vite dev` while respecting any explicit user setting. |
| **Production base URL** | Reads an env variable (`PUBLIC_URL` by default) during `vite build` and writes it into `config.base` so assets reference the right CDN or subpath. |
| **Build zip** | Archives the entire output directory into a single `.zip` after build via `archiver`. Sync, async, and static filename forms all supported. |
| **.htaccess generation** | Writes a SPA-friendly Apache `.htaccess` into the output directory — SPA fallback rewrites, force-HTTPS, GZIP, cache headers. Opt-in. |
| **Pre-render service** | Emits a `prerender.php` and splices a crawler-routing rewrite into the `.htaccess` so bots get server-rendered HTML while real users get the SPA. Opt-in. |

---

## Installation

```sh
npm install -D @mongez/vite
```

```sh
yarn add -D @mongez/vite
```

```sh
pnpm add -D @mongez/vite
```

`vite >= 5.0.0` is a peer dependency.

---

## Quick start

Register the plugin in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite(),
    react(),
  ],
});
```

That's the default profile — env loading, `index.html` interpolation, tsconfig aliases, auto-open, production base URL, and build zip all on; `htaccess` and `preRender` opt-in.

Drop two `.env` files at the project root:

```bash
# .env.development
APP_NAME="My App"
APP_PORT=3000

# .env.production
APP_NAME="My App"
PUBLIC_URL=https://cdn.example.com/
```

And reference env values in `index.html` with `__KEY__` tokens:

```html
<!-- index.html -->
<title>__APP_NAME__</title>
```

What happens at each command:

- **`vite dev`** — loads `.env.development`, replaces `__APP_NAME__` with `My App`, mirrors tsconfig paths into `resolve.alias`, opens the browser at `http://localhost:5173`.
- **`vite build`** — loads `.env.production`, sets `config.base = "https://cdn.example.com/"`, replaces `__APP_NAME__`, emits `dist/build.zip` ready to ship.

For an Apache deploy with crawler prerender, add `htaccess: true` + `preRender: { url: ... }` to the plugin call and `dist/` will also include `.htaccess` and `prerender.php`. See the [Recipes](#recipes) section.

---

## Env loading

`@mongez/vite` calls `@mongez/dotenv`'s `loadEnv` from inside its `config` hook so env values are populated before any other plugin reads them. The file picked depends on the Vite command:

| Command | File search order |
|---|---|
| `vite build` | `.env.production` → `.env.build` → `.env` |
| `vite dev` (`serve`) | `.env.development` → `.env.local` → `.env` |

Whichever exists first wins. If none exist, the helper is a no-op. `.env.shared` is loaded first underneath, so common defaults live there and environment-specific files override.

### Locking a specific file (multi-stage builds)

```ts
mongezVite({ productionEnvName: "staging" });
```

During `vite build`, the plugin loads ONLY `.env.staging`. There is no fallback — if `.env.staging` is missing the loader silently does nothing. During `vite dev` the option is ignored.

```sh
STAGE=staging vite build   # loads .env.staging
vite dev                   # loads .env.development as usual
```

### Reading typed values back

`@mongez/dotenv` coerces `"3000"` to `3000`, `"true"` to `true`, `"null"` to `null`, and leaves quoted strings as strings. Read them through `env()`:

```ts
import { env } from "@mongez/dotenv";

env("APP_PORT");        // 3000  (number)
env("DEBUG");           // true  (boolean)
env("MISSING", "x");    // "x"   (fallback)
```

> The loader uses `override: true`, so `process.env.APP_PORT` also exists — but Node's `process.env` setter stringifies everything, so it reads back as `"3000"`. Use `env()` if you want the typed view.

### `.env.shared` layering

`@mongez/dotenv` loads `.env.shared` first (when `loadSharedEnv: true`, the default — and `@mongez/vite` always passes it). The environment-specific file then layers on top, so common values live once in shared and per-env overrides only restate what differs.

```bash
# .env.shared
APP_NAME="My App"
APP_URL=https://example.com

# .env.production
DB_HOST=prod-db.example.com
DEBUG=false
```

After load:

- `env("APP_NAME")` → `"My App"` (from shared)
- `env("DB_HOST")` → `"prod-db.example.com"` (from production)
- `env("DEBUG")` → `false` (typed boolean, from production)

If a key appears in both, the environment-specific file wins.

### `${VAR}` interpolation between keys

Values can reference earlier keys with `${VAR}`. Useful for composed URLs:

```bash
APP_HOST=localhost
APP_PORT=3000
APP_URL=http://${APP_HOST}:${APP_PORT}
```

```ts
env("APP_URL");   // "http://localhost:3000"
```

Interpolation reads from `@mongez/dotenv`'s internal store at parse time — the referenced key must appear earlier in the same file or in `.env.shared`.

---

## Env in HTML

The plugin registers a `transformIndexHtml` hook that iterates over every key in the env store and replaces `<prefix><KEY><suffix>` tokens in every emitted HTML file.

```html
<!DOCTYPE html>
<html lang="__APP_DEFAULT_LOCALE__" dir="__APP_DEFAULT_DIRECTION__">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="__APP_FAV_ICON__" />
    <meta name="theme-color" content="__APP_PRIMARY_COLOR__" />
    <meta name="description" content="__APP_DESCRIPTION__" />
    <title>__APP_NAME__</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```bash
# .env.production
APP_NAME="My App"
APP_DEFAULT_LOCALE=en
APP_DEFAULT_DIRECTION=ltr
APP_FAV_ICON=/favicon.svg
APP_PRIMARY_COLOR=#0066ff
APP_DESCRIPTION="A web app"
```

Customise the delimiters:

```ts
mongezVite({
  htmlEnvPrefix: "{{",
  htmlEnvSuffix: "}}",
});
```

```html
<title>{{APP_NAME}}</title>
```

> **Tokens for unknown keys are left intact.** If you see `__APP_NAME__` in your shipped HTML, the env variable wasn't loaded — there is no warning.

> **Avoid `%` or `$` in URL attributes.** Vite parses `<link href>` / `<script src>` as URLs before the hook runs and trips on those characters. Stick to `__KEY__`, `{{KEY}}`, or `<!-- KEY -->`.

---

## tsconfig path aliases

`compilerOptions.paths` from `tsconfig.json` is mirrored into `resolve.alias` so `import App from "@/App"` works in both `tsc` and Vite without a second plugin.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "components/*": ["src/components/*"],
      "lib": ["src/lib/index.ts"]
    }
  }
}
```

After the `config` hook runs:

```ts
[
  { find: "@",          replacement: "<cwd>/src" },
  { find: "components", replacement: "<cwd>/src/components" },
  { find: "lib",        replacement: "<cwd>/src/lib/index.ts" },
]
```

For each `[find, value]` pair, the trailing `/*` is stripped from both sides and the replacement is resolved against `process.cwd()`.

Opt out when you already use `vite-tsconfig-paths` or want to drive aliases by hand:

```ts
mongezVite({ linkTsconfigPaths: false });
```

> **Only the first entry of each `paths` value survives.** The transform reads `String(value)` rather than iterating, so `"foo/*": ["src/foo/*", "lib/foo/*"]` reads the join-form only. Single-entry arrays are the common case.

> **`baseUrl` is ignored.** Aliases always resolve against `process.cwd()`. If your `paths` are written relative to a different `baseUrl`, the resulting aliases will be wrong — flatten them or set `linkTsconfigPaths: false` and wire `resolve.alias` directly.

> **`tsconfig.json` `extends` is not followed.** Only the top file is read. Re-declare `paths` at the top level or use your own resolver.

---

## Auto-open browser

```ts
mongezVite({ autoOpenBrowser: true });   // default — opens during `vite dev`
mongezVite({ autoOpenBrowser: false });  // dev server stays quiet
```

The helper runs during `serve` only — never during `build`. It sets `config.server.open = true` if and only if your `vite.config.ts` hasn't already declared a literal-boolean `server.open`:

| Your `server.open` | Plugin `autoOpenBrowser` | Vite command | Result |
|---|---|---|---|
| unset | `true` (default) | `serve` | Sets `server.open = true` |
| `false` | `true` | `serve` | Untouched — your explicit `false` wins |
| `true` | anything | `serve` | Untouched |
| anything | anything | `build` | Untouched |

The string form (`server: { open: "/some/path" }`) is NOT detected as explicit and gets clobbered. To open a specific path, set `autoOpenBrowser: false` and declare `server.open` yourself.

---

## Build zip

```ts
mongezVite();                                  // dist/build.zip (default)
mongezVite({ compressBuild: false });          // skip
mongezVite({ compressedFileName: "myapp.zip" });
```

Filename forms — static string, sync function, or async function — all work:

```ts
mongezVite({
  compressedFileName: () => `myapp-${process.env.GIT_TAG}.zip`,
});

mongezVite({
  compressedFileName: async () => {
    const tag = await readVersionTag();
    return `myapp-${tag}.zip`;
  },
});
```

The zip is created from the **contents** of the output directory (not the directory itself), then moved back inside it — so unzipping at the destination drops files straight into the docroot. The zip honours `config.build.outDir` (`"dist"` by default):

| `config.build.outDir` | Zip ends up at |
|---|---|
| (default `"dist"`) | `dist/build.zip` |
| `"build"` | `build/build.zip` |
| `"public/static"` | `public/static/build.zip` |
| (with `compressedFileName: "myapp.zip"`) | `<outDir>/myapp.zip` |

The work runs inside Vite's `writeBundle` hook with `sequential: true` and is fully awaited — by the time `vite build` exits, `dist/build.zip` is finalised on disk and safe for chained deploy scripts.

> **Only zip format is supported.** For `.tar.gz` or other archives, set `compressBuild: false` and run your own packaging step after `vite build`.

> **The zip does NOT contain itself.** It captures the `outDir` state from before the move, so unzipping at the destination doesn't recreate a recursive zip-of-a-zip.

---

## .htaccess generation

```ts
mongezVite({ htaccess: true });   // emits dist/.htaccess
```

Defaults to **disabled** — opt in explicitly. The bundled `.htaccess`:

- `RewriteEngine On` + `Options +FollowSymLinks -Indexes`.
- Force HTTPS (and strip leading `www.`).
- SPA fallback: every URL that isn't a real file or asset extension routes to `index.html`.
- GZIP via `mod_gzip` and `mod_deflate`.
- 31-day `Expires` headers for `jpg`/`png`/`css`/`js`.
- `Cache-Control` headers per filetype.

Each block is wrapped in `<ifModule>` so an Apache install missing a module degrades gracefully. The whitelisted asset subdirectory is `assets/` and the whitelisted extensions are `jpg|png|ico|jpeg|webp|gif|bmp|webp|svg` — if you use a custom `assetsDir` or emit `.avif` / `.webm`, post-process the file in your deploy step or set `htaccess: false` and ship your own.

The bundled cache headers, per filetype:

| Filetype | `Expires` | `Cache-Control` |
|---|---|---|
| `ico`, `flv`, `jpg`, `jpeg`, `png`, `gif`, `css`, `swf` | 31 days | `max-age=2678400, public` |
| `html`, `htm` | 2 hours | `max-age=7200, private, must-revalidate` |
| `pdf` | 31 days | `max-age=2678400, public` |

To tune any of these, post-process the emitted `.htaccess` in your deploy step — the plugin doesn't expose per-filetype options today.

> **Force-HTTPS applies on every request.** If Apache fronts a localhost dev server, expect redirects to `https://localhost`. Usually irrelevant — `vite dev` runs against Vite's own server, not Apache.

---

## Pre-render service

For SEO-sensitive SPAs, route crawler traffic through a pre-rendering service while real users get the SPA. The plugin emits `prerender.php` into the output directory and splices a `RewriteRule` into the `.htaccess`.

```ts
mongezVite({
  htaccess: true,                  // REQUIRED — the rewrite lives in .htaccess
  preRender: {
    url: "https://render.mentoor.io",
    crawlers: "Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter",
    delay: 5000,
    cache: false,
  },
});
```

| Key | Type | What it does |
|---|---|---|
| `url` | `string` | The external prerender service. Required — the plugin throws at build time if missing. |
| `crawlers` | `string` | Pipe-separated regex alternation matched case-insensitively against `User-Agent`. |
| `delay` | `number` | Milliseconds the service waits before rendering — lets your SPA finish loading data. |
| `cache` | `boolean` | When truthy, the generated PHP caches each rendered URL under `<outDir>/cache/<sha1>.html`. |

A request from a crawler matches the rewrite, hits `prerender.php`, the PHP forwards to your service with `?url=&delay=&cache=&__agent=`, and the response is returned (and optionally cached on disk). A request from a real user agent skips the rewrite and falls through to the SPA fallback (`index.html`).

> **`preRender` requires `htaccess: true`.** The rewrite rule lives inside the `.htaccess` — without it the PHP file sits there unreachable. The plugin throws a descriptive build-time error if you set `preRender` without `htaccess` or without `preRender.url`.

> **The cache directory is created lazily by the PHP.** Make sure the Apache user has write permission to `<outDir>/cache/`.

---

## Production base URL

```ts
mongezVite();   // envBaseUrlKey defaults to "PUBLIC_URL"
```

```bash
# .env.production
PUBLIC_URL=https://cdn.example.com
```

During `vite build`, the plugin reads `env("PUBLIC_URL")`, normalises trailing slashes, and writes the result into `config.base`. Built `index.html` then references assets at `https://cdn.example.com/assets/index-<hash>.js`.

Pick a different env key:

```ts
mongezVite({ envBaseUrlKey: "CDN_HOST" });
```

Normalisation is `rtrim(value, "/") + "/"` — strip all trailing slashes, add exactly one back. `https://cdn.example.com///` becomes `https://cdn.example.com/`; `https://cdn.example.com/app` becomes `https://cdn.example.com/app/`. If the env variable is unset, `config.base` falls back to `"/"` (the same as Vite's default).

| When | What happens to `config.base` |
|---|---|
| `vite build`, env set, no user `base` | Set to the normalised env value. |
| `vite build`, env unset, no user `base` | Set to `"/"`. |
| `vite build`, user `base` already set in `vite.config.ts` | Untouched. |
| `vite dev` (`serve`) | Untouched — dev mode keeps its own base. |

---

## Common pitfalls

A handful of edges have caught users in the past — worth knowing before they bite.

| Pitfall | What happens | How to avoid |
|---|---|---|
| `productionEnvName` set, file missing | Loader silently does nothing — no warning, no fallback. Build runs with `process.env` only. | Make sure the matching `.env.<name>` file exists before invoking `vite build`. |
| Token in `index.html` doesn't match an env key | The literal `__KEY__` stays in the shipped HTML — there is no warning. | Verify with `env.all()` (or just look at `dist/index.html`) before deploying. |
| Setting `preRender: {}` without `url` | Plugin throws at build time with a descriptive error (`preRender.url is required`). | Pass `preRender.url` explicitly, or set `preRender: false` to disable. |
| Setting `preRender` without `htaccess: true` | Plugin throws — the rewrite rule lives inside the `.htaccess`, so without it the PHP file would sit unreachable. | Pair `preRender` with `htaccess: true`. |
| Using `server.open: "/path"` alongside the plugin | The string form is not detected as explicit and gets clobbered to `true`. | Set `autoOpenBrowser: false` and declare `server.open` yourself. |
| `vite-tsconfig-paths` already installed alongside `mongezVite()` | Both plugins write to `resolve.alias` — last one wins, potentially inconsistently. | Set `linkTsconfigPaths: false` and let the dedicated plugin handle it. |
| `tsconfig.json` uses `extends` for `paths` | The plugin reads only the top file. Extended `paths` are invisible. | Flatten the relevant `paths` into the top file, or set `linkTsconfigPaths: false`. |
| Running `vite` from a subdirectory | `process.cwd()` is not the project root — env files / `tsconfig.json` are not found. | Always run from the project root, or set `dir` via your own bootstrap. |

---

## Plugin lifecycle

The whole package is a single Vite `PluginOption` with three hooks. Vite calls them in this order:

```
mongezVite()
   │
   ├─ config hook  (Vite calls once at startup)
   │    │
   │    ├─ resolveAutoOpenBrowser       (server.open)
   │    ├─ resolveTsConfigAlias         (resolve.alias)
   │    ├─ resolveEnvironmentVariables  (loadEnv → @mongez/dotenv store)
   │    └─ resolveOtherConfig           (config.base, optimizeDeps)
   │
   ├─ transformIndexHtml  (per HTML file Vite emits)
   │    └─ replace __KEY__ tokens
   │
   └─ writeBundle  (Vite calls once after build, sequential: true)
        ├─ generateHtaccess  (emit .htaccess + prerender.php)
        └─ compressBuild     (zip the output dir, fully awaited)
```

Key observations:

- **The `config` hook runs before any other plugin sees the resolved config.** By the time it returns, `server.open`, `config.base`, `resolve.alias`, and `optimizeDeps` are filled in (when the user didn't already set them) and the env store is populated.
- **The plugin never overwrites user-provided config.** `server.open`, `config.base`, `resolve.alias`, and `optimizeDeps` are all checked before setting — your `vite.config.ts` wins on every conflict.
- **`writeBundle` is `sequential: true` and fully awaited.** Zip and `.htaccess` writes finish before `vite build` exits, so chained scripts (`vite build && upload-dist.sh`) see the finalised files.

---

## TypeScript

The default export is `mongezVite(options?: MongezViteOptions): PluginOption`. The full options type:

```ts
import type { MongezViteOptions } from "@mongez/vite";
import type { UserConfig } from "vite";

type MongezViteOptions = {
  /** Forward-compatible: a literal base URL. Today, derive base from env via `envBaseUrlKey`. */
  baseUrl?: string;
  /** Env key the plugin reads to derive `config.base` during build. Default: "PUBLIC_URL". */
  envBaseUrlKey?: string;
  /** Lock the build-time env file to `.env.<name>`. No fallback if missing. */
  productionEnvName?: string;
  /** Prefix delimiter for `__KEY__`-style tokens in index.html. Default: "__". */
  htmlEnvPrefix?: string;
  /** Suffix delimiter for `__KEY__`-style tokens in index.html. Default: "__". */
  htmlEnvSuffix?: string;
  /** Set `server.open = true` during `vite dev`. Default: true. */
  autoOpenBrowser?: boolean;
  /** Mirror tsconfig paths into vite's resolve.alias. Default: true. */
  linkTsconfigPaths?: boolean;
  /** Tied to `linkTsconfigPaths`; both must be truthy. Default: true. */
  tsconfigAlias?: boolean;
  /** Replaces vite's optimizeDeps when the user hasn't set it. */
  optimizeDeps?: UserConfig["optimizeDeps"];
  /** Zip the output directory after build. Default: true. */
  compressBuild?: boolean;
  /** Name for the emitted zip. Sync, async, or static string. Default: "build.zip". */
  compressedFileName?: string | (() => string) | (() => Promise<string>);
  /** Emit a SPA-friendly .htaccess to the output dir. Default: false. */
  htaccess?: boolean;
  /** Pre-render service config. False to skip. Default: false. */
  preRender?: {
    crawlers?: string;
    url?: string;
    delay?: number;
    cache?: boolean;
  } | false;
};
```

Defaults (from `src/default-options.ts`):

| Option | Default |
|---|---|
| `envBaseUrlKey` | `"PUBLIC_URL"` |
| `htmlEnvPrefix` / `htmlEnvSuffix` | `"__"` |
| `autoOpenBrowser` | `true` |
| `linkTsconfigPaths` / `tsconfigAlias` | `true` |
| `compressBuild` | `true` |
| `compressedFileName` | `"build.zip"` |
| `htaccess` | `false` |
| `preRender` | `false` |
| `optimizeDeps.entries` | `["<cwd>/index.html", "<cwd>/src/apps/**/provider.ts"]` |

The `optimizeDeps.entries` default reflects the Mongez convention of grouping multiple sub-apps under `src/apps/<app>/provider.ts`. For a flat app that has only `index.html`, the extra glob is harmless — it simply matches nothing.

---

## Recipes

### Inject env vars into `index.html`

When you need the page title, fav icon, theme colour, or any other static-looking HTML attribute to vary per environment, drop env tokens directly into `index.html` and let the plugin substitute them at build / dev time.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [mongezVite()],   // htmlEnvPrefix / htmlEnvSuffix default to "__"
});
```

```bash
# .env.production
APP_NAME="Mentoor"
APP_FAV_ICON=https://cdn.example.com/favicon.svg
APP_PRIMARY_COLOR=#0066ff
```

```html
<!-- index.html -->
<link rel="icon" type="image/svg+xml" href="__APP_FAV_ICON__" />
<meta name="theme-color" content="__APP_PRIMARY_COLOR__" />
<title>__APP_NAME__</title>
```

After `vite build` the tokens are replaced verbatim. To use `{{KEY}}` instead, pass `htmlEnvPrefix: "{{", htmlEnvSuffix: "}}"`.

### Auto-open the browser to a specific path on dev

The plugin's `autoOpenBrowser` defaults to `true` but always sets `server.open = true` (root) — never a specific path. To open `/dashboard` instead, disable the helper and declare `server.open` yourself.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  server: { open: "/dashboard" },          // your explicit setting wins
  plugins: [
    mongezVite({ autoOpenBrowser: false }), // skip the helper
  ],
});
```

`vite dev` now opens `http://localhost:5173/dashboard`.

### Ship one Apache `.htaccess` + crawler prerender + zipped artifact

When deploying to Apache, you want SPA rewrites, force-HTTPS, GZIP, cache headers, Googlebot / WhatsApp / Facebook crawler routing, and a single zip you can `scp` to the server.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      htaccess: true,
      preRender: {
        url: "https://render.mentoor.io",
        cache: true,
      },
      compressedFileName: () => `myapp-${process.env.GIT_TAG || "latest"}.zip`,
    }),
  ],
});
```

```sh
GIT_TAG=v1.4.2 vite build
# → dist/.htaccess
# → dist/prerender.php
# → dist/myapp-v1.4.2.zip   (contains the above + index.html + assets/)
scp dist/myapp-v1.4.2.zip server:/var/www/
```

### Build for multiple stages (staging / preprod / production)

When CI builds the same app against several env files, lock the build-time env file per stage via `productionEnvName`. The default `serve` chain is unaffected, so local `vite dev` keeps using `.env.development`.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      productionEnvName: process.env.STAGE,   // "staging" → .env.staging
    }),
  ],
});
```

```sh
STAGE=staging vite build      # loads .env.staging
STAGE=preprod vite build      # loads .env.preprod
STAGE=production vite build   # loads .env.production
```

Without `STAGE`, `productionEnvName` is `undefined` and the plugin falls back to the default `.env.production` → `.env.build` → `.env` chain.

### Set the production base URL from a CDN env variable

When the production deploy pushes assets to a CDN at a different origin from the app server, derive `config.base` from an env variable rather than hardcoding it in `vite.config.ts`. The dev server stays at `localhost:5173`; only `vite build` picks up the CDN.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      envBaseUrlKey: "CDN_HOST",   // default is "PUBLIC_URL"
    }),
  ],
});
```

```bash
# .env.production
CDN_HOST=https://assets.example.com
```

```sh
vite build   # config.base = "https://assets.example.com/" — assets emit at that origin
```

### Make `@/components/...` resolve in both `tsc` and Vite

The default `linkTsconfigPaths: true` reads `compilerOptions.paths` from `tsconfig.json` and installs them into `resolve.alias`, so `@/...` imports resolve in both `tsc` and Vite without bolting on `vite-tsconfig-paths`.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib": ["src/lib/index.ts"]
    }
  }
}
```

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [mongezVite()],   // linkTsconfigPaths defaults to true
});
```

```ts
// src/App.tsx
import Button from "@components/Button";
import { foo } from "@lib";
```

Both `tsc` and Vite resolve the imports against `<cwd>/src/components/Button` and `<cwd>/src/lib/index.ts`. If you already use `vite-tsconfig-paths`, set `linkTsconfigPaths: false` to avoid double-writing the alias array.

### Tag the build zip with a git tag or build number

When CI builds the same SPA against different stages, you want the artifact name to encode the build (so deploy logs and rollback scripts can find the right file). The `compressedFileName` option accepts a sync or async function — it runs once per build and the return value is the zip name.

```ts
// vite.config.ts
import { execSync } from "node:child_process";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      compressedFileName: () => {
        const tag = process.env.GIT_TAG
          || execSync("git rev-parse --short HEAD").toString().trim();
        const stamp = new Date().toISOString().split("T")[0];
        return `myapp-${stamp}-${tag}.zip`;
      },
    }),
  ],
});
```

```sh
GIT_TAG=v1.4.2 vite build
# → dist/myapp-2026-05-26-v1.4.2.zip
```

For an async lookup (e.g. resolving a build ID from an S3 metadata bucket), return a `Promise<string>`. The plugin awaits it inside the `writeBundle` handler before zipping.

### Use HTML-comment delimiters when `__` is taken

The default `__KEY__` token shape is invisible enough for most projects, but if your HTML is processed by another tool that strips `__double_underscores__`, switch to HTML-comment-shaped tokens — they survive every templating pipeline.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      htmlEnvPrefix: "<!-- ",
      htmlEnvSuffix: " -->",
    }),
  ],
});
```

```html
<!-- index.html -->
<title><!-- APP_NAME --></title>
```

The plugin's `transformIndexHtml` runs before any downstream HTML processor sees the file, so the tokens are gone by the time the secondary tool inspects it.

### Read the loaded env from `vite.config.ts` or build-time code

After the plugin's `config` hook runs, the `@mongez/dotenv` store is populated — anything that runs at build / dev time can read typed values through `env()`. Code that ships to the browser still needs Vite's own `import.meta.env.VITE_*` mechanism.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import mongezVite from "@mongez/vite";
import { env } from "@mongez/dotenv";

export default defineConfig(({ command }) => ({
  plugins: [mongezVite()],
  server: {
    port: env("VITE_DEV_PORT", 5173) as number,   // typed value from .env.development
  },
}));
```

> Values that need to reach the browser must be prefixed `VITE_` in your `.env` file and read via `import.meta.env.VITE_*` from client code — the `@mongez/dotenv` store lives in Node only.

---

## Related packages

| Package | Use when you need |
|---|---|
| [`@mongez/dotenv`](https://github.com/hassanzohdy/mongez-dotenv) | The underlying `.env` loader. `@mongez/vite` calls into it for file resolution, type coercion, and the `env()` reader. |
| [`@mongez/fs`](https://github.com/hassanzohdy/mongez-fs) | Synchronous filesystem helpers (`getFile`, `putFile`, `moveFile`). Used internally to read `tsconfig.json` and write `.htaccess` / move the zip. |
| [`@mongez/copper`](https://github.com/hassanzohdy/mongez-copper) | ANSI color helpers for the plugin's build-time log output. |
| [`@mongez/reinforcements`](https://github.com/hassanzohdy/reinforcements) | TypeScript utility belt — `rtrim` is used to normalise the base URL. |

For the full reference in a single LLM-friendly file, see [`llms-full.txt`](./llms-full.txt). For per-topic deep-dives (one card per plugin, plus a recipes card), see [`skills/`](./skills). For release history, see [`CHANGELOG.md`](./CHANGELOG.md).

---

## License

MIT — see [LICENSE](./LICENSE).
