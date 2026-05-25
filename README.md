# @mongez/vite

> A drop-in Vite plugin for SPA workflows: typed env loading with `NODE_ENV`-aware resolution, in-HTML env interpolation, tsconfig path aliasing, auto-open dev server, post-build `.zip` packaging, `.htaccess` generation, and pre-render injection — all from one plugin in `vite.config.ts`.

`@mongez/vite` is the build-time companion to the rest of the `@mongez/*` family. The whole package is a single Vite plugin object that wires up six small features. Each is independently opt-in via the options bag — you can take the env loader on its own and disable the rest, or take everything as a single declarative knob.

The plugin is declarative — you bolt it onto `plugins: []` and it mutates the resolved Vite config + adds two lifecycle hooks (`transformIndexHtml`, `writeBundle`). No runtime code ships to the browser.

## Install

```sh
yarn add -D @mongez/vite
# peer dep: vite >= 5.0.0
```

## A 30-second tour

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      // 1. Use env values inside index.html as __KEY__ tokens.
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",

      // 2. Auto-open the browser during `vite dev`.
      autoOpenBrowser: true,

      // 3. Mirror tsconfig.json `paths` into vite's resolve.alias.
      linkTsconfigPaths: true,

      // 4. Set production base from env (PUBLIC_URL by default).
      envBaseUrlKey: "PUBLIC_URL",

      // 5. Post-build: zip the build directory.
      compressBuild: true,
      compressedFileName: "my-app.zip",

      // 6. Post-build: emit .htaccess + (optional) prerender.php.
      htaccess: true,
      preRender: {
        url: "https://render.mentoor.io",
      },
    }),
    react(),
  ],
});
```

```bash
# .env.production
PUBLIC_URL=https://cdn.example.com/
APP_NAME=My App
```

```html
<!-- index.html -->
<title>__APP_NAME__</title>
```

After `vite build`, `dist/` contains an emitted `.htaccess`, a `prerender.php`, and a `my-app.zip` of everything. `config.base` becomes `https://cdn.example.com/` and `<title>` reads "My App".

## What's in the box

| Feature | Option | Default | What it does |
|---|---|---|---|
| Typed env loading | `productionEnvName` | auto-detect | Picks the right `.env.<environment>` file via `@mongez/dotenv`. |
| Production base URL | `envBaseUrlKey`, `baseUrl` | `PUBLIC_URL` | Sets `config.base` from env during `vite build`. |
| Env-in-HTML interpolation | `htmlEnvPrefix`, `htmlEnvSuffix` | `__` | Replaces `__KEY__` tokens in `index.html` with env values. |
| Auto-open browser | `autoOpenBrowser` | `true` | Sets `server.open = true` during `vite dev`. |
| tsconfig path aliases | `linkTsconfigPaths`, `tsconfigAlias` | both `true` | Mirrors `compilerOptions.paths` into `resolve.alias`. |
| Build zip | `compressBuild`, `compressedFileName` | on, `build.zip` | Archives the output dir into a single zip after build. |
| `.htaccess` emit | `htaccess` | `false` | Writes a SPA-friendly `.htaccess` into the output dir. |
| Pre-render service | `preRender` | `false` | Emits `prerender.php` + rewrite rules for crawler bots. |

## Env loading

Calling `mongezVite()` triggers `@mongez/dotenv` to load the right file for the current command:

| Command | File search order (without `productionEnvName`) |
|---|---|
| `vite build` | `.env.production` → `.env.build` → `.env` |
| `vite dev` (`serve`) | `.env.development` → `.env.local` → `.env` |

Pass `productionEnvName: "stage"` to lock the build-time file to a specific name:

```ts
mongezVite({ productionEnvName: "stage" });
// → loads only .env.stage during `vite build`
// → no fallback; if .env.stage is missing the loader is a no-op
```

The dotenv parser coerces values: `"3000"` becomes `3000`, `"true"` becomes `true`, `"null"` becomes `null`, quoted strings stay strings. Read the typed values back via `env("KEY")` from `@mongez/dotenv`.

## Production base URL

```bash
# .env.production
PUBLIC_URL=https://cdn.example.com
```

```ts
mongezVite();   // PUBLIC_URL is the default key
```

During `vite build` the plugin sets `config.base = "https://cdn.example.com/"` (trailing slash added if missing). To use a different env key:

```ts
mongezVite({ envBaseUrlKey: "ASSETS_HOST" });
```

If the env variable is unset, `config.base` falls back to `"/"`. The plugin does NOT overwrite a base you've already specified in `vite.config.ts`.

## Env variables in `index.html`

Reference any env value in HTML with the affix delimiters (default `__`):

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

Customize the delimiters via `htmlEnvPrefix` / `htmlEnvSuffix`:

```ts
mongezVite({
  htmlEnvPrefix: "{{",
  htmlEnvSuffix: "}}",
});
```

> Avoid `%` or `$` inside `<link>` and `<script>` `href` / `src` attributes — Vite's HTML transform parses those as URLs first and trips on unrecognized characters. Stick with `__KEY__` or `{{KEY}}`.

## Auto-open browser

```ts
mongezVite({ autoOpenBrowser: true });   // default — opens during `vite dev`
mongezVite({ autoOpenBrowser: false });  // dev server stays quiet
```

The plugin sets `server.open = true` ONLY during the `serve` command, and ONLY if you haven't already declared `server.open` yourself. Explicitly setting `server.open: false` in your `vite.config.ts` always wins.

## tsconfig path aliases

`@mongez/vite` reads your `tsconfig.json`'s `compilerOptions.paths` and mirrors them into `resolve.alias`:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "components/*": ["src/components/*"]
    }
  }
}
```

```ts
// vite.config.ts
mongezVite({ linkTsconfigPaths: true }); // default
```

Now `import App from "@/App"` and `import Button from "components/Button"` work in both `tsc` and Vite.

Set `linkTsconfigPaths: false` to skip — useful if you already have your own `vite-tsconfig-paths` plugin or want to drive `resolve.alias` by hand:

```ts
mongezVite({ linkTsconfigPaths: false });
```

The plugin does NOT overwrite a pre-existing `resolve.alias` you've set in `vite.config.ts`. If you mix the two, your own aliases win.

## Build zip

```ts
mongezVite({ compressBuild: true });           // default — emits dist/build.zip
mongezVite({ compressBuild: false });          // skip
mongezVite({ compressedFileName: "myapp.zip" });
mongezVite({
  compressedFileName: () => `myapp-${Date.now()}.zip`,
});
```

The zip contains the **contents** of the output directory (not the directory itself), and is placed back inside the output directory once built. Pass an async function if your filename needs an external lookup:

```ts
mongezVite({
  compressedFileName: async () => {
    const tag = await readVersionTag();
    return `myapp-${tag}.zip`;
  },
});
```

## `.htaccess` generation

```ts
mongezVite({ htaccess: true });   // emits dist/.htaccess
```

The bundled `.htaccess` includes:

- `RewriteEngine On` + `Options +FollowSymLinks -Indexes`.
- Force HTTPS / strip leading `www.`.
- SPA-friendly rewrite: every URL that isn't a real file or asset extension routes to `index.html`.
- GZIP via `mod_gzip` and `mod_deflate`.
- 31-day `Expires` headers for `jpg`/`png`/`css`/`js`.
- Cache-Control headers per file type.

Defaults to **disabled**. Opt in explicitly with `htaccess: true`.

## Pre-render service

For SEO-sensitive SPAs, route bot traffic through a pre-rendering server. The plugin emits a `prerender.php` and adds a `RewriteRule` to the `.htaccess` so crawlers get fully-rendered HTML:

```ts
mongezVite({
  htaccess: true,         // required — prerender lives in .htaccess
  preRender: {
    url: "https://render.mentoor.io",
    crawlers: "Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter",
    delay: 5000,
    cache: false,
  },
});
```

The PHP file calls out to the prerender URL with the visited path, the requesting user agent, and the two flags above. Cached responses (when `cache: true`) live under a `cache/` directory next to `prerender.php`.

Set `preRender: false` to skip entirely (the default).

## Full options reference

```ts
type MongezViteOptions = {
  /** Production base URL — passed verbatim to vite's `config.base`. */
  baseUrl?: string;
  /** Env key the plugin reads to derive `config.base` during build. Default: "PUBLIC_URL". */
  envBaseUrlKey?: string;
  /** Locks the env file picker to `.env.<name>` during build. No fallback. */
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
  /** Replace vite's optimizeDeps.entries with this list. */
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

## Caveats

- **Pre-render requires `htaccess: true`.** Without it the rewrite rule has nowhere to live.
- **Pre-render requires `preRender.url`.** If you opt into `preRender` without a `url`, the plugin throws during the build with a clear error message. Pass `preRender: false` to disable entirely.
- **`.env.production` loaded values write through to `process.env`.** `@mongez/dotenv` defaults to `override: true`. Read typed values back through `env("KEY")` from `@mongez/dotenv`; reading `process.env.KEY` always gives you the string-coerced form.
- **Option names use the `htmlEnv*` prefix.** Older revisions of this README documented `envPrefix` / `envSuffix`, but the runtime reads `htmlEnvPrefix` / `htmlEnvSuffix`. The latter is the source of truth.

## Examples

### Minimal SPA setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite(),   // everything default-on except htaccess + preRender
    react(),
  ],
});
```

```bash
# .env.development
APP_NAME="My App"
APP_PORT=3000

# .env.production
APP_NAME="My App"
PUBLIC_URL=https://cdn.example.com/
```

### Production CDN base URL via env

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      envBaseUrlKey: "CDN_HOST",
    }),
  ],
});
```

```bash
# .env.production
CDN_HOST=https://assets.example.com
```

Result: `vite build` writes assets with `https://assets.example.com/` as the base.

### Apache deployment with .htaccess + prerender

```ts
mongezVite({
  htaccess: true,
  preRender: {
    url: "https://render.mentoor.io",
    cache: true,
  },
});
```

After `vite build`:

```
dist/
├── assets/
│   └── ...
├── index.html
├── .htaccess          (SPA rewrites + Googlebot routing)
├── prerender.php
└── build.zip
```

Drop `dist/` onto an Apache host and SPA routing + crawler pre-rendering work without extra config.

### Multi-stage builds

```ts
mongezVite({
  productionEnvName: process.env.STAGE,   // "staging" → .env.staging
});
```

```sh
STAGE=staging vite build   # loads .env.staging
STAGE=preprod vite build   # loads .env.preprod
```

### Disable everything except env loading

```ts
mongezVite({
  autoOpenBrowser: false,
  linkTsconfigPaths: false,
  compressBuild: false,
  htaccess: false,
});
```

The plugin reduces to "load the right `.env` file, set `config.base`, and replace `__KEY__` tokens in `index.html`."

## Related packages

| Package | Purpose |
|---|---|
| [`@mongez/dotenv`](https://github.com/hassanzohdy/mongez-dotenv) | The underlying `.env` loader. Used here to read env files. |
| [`@mongez/fs`](https://github.com/hassanzohdy/mongez-fs) | Synchronous filesystem helpers (`getFile`, `putFile`). Used to read tsconfig + write `.htaccess`. |
| [`@mongez/copper`](https://github.com/hassanzohdy/mongez-copper) | ANSI color helpers for log output. |
| [`@mongez/reinforcements`](https://github.com/hassanzohdy/reinforcements) | TypeScript utility belt. `rtrim` is used to normalise the base URL. |

## License

MIT
