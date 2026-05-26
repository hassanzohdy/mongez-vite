---
name: mongez-vite-recipes
description: |
  Ready-to-use vite.config.ts compositions for common @mongez/vite scenarios including minimal SPA setup, CDN base URL, Apache deploy with prerender, multi-stage builds, and more.
  TRIGGER when: user wants a working starting-point `vite.config.ts` / `vite.config.js` that composes `mongezVite()` with multiple options (`htaccess`, `preRender`, `productionEnvName`, `envBaseUrlKey`, `compressedFileName`, `htmlEnvPrefix`/`htmlEnvSuffix`, `linkTsconfigPaths`); user asks "give me a `vite.config.ts` example for @mongez/vite", "how do I set up multi-stage builds with mongezVite", "show me an Apache deploy pipeline with mongezVite + prerender + zip".
  SKIP: single-feature deep dives — route to the matching feature skill instead (`mongez-vite-env-loading`, `mongez-vite-env-in-html`, `mongez-vite-production-base-url`, `mongez-vite-build-zip`, `mongez-vite-htaccess`, `mongez-vite-prerender`, `mongez-vite-tsconfig-aliases`, `mongez-vite-auto-open-browser`); first-time orientation (use `mongez-vite-overview`); generic Vite config recipes not involving `@mongez/vite`.
---

# Recipes

Idiomatic compositions of `@mongez/vite` features. Drop the snippets into your `vite.config.ts` (and the matching `.env` files) and tweak.

## Minimal SPA setup

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

```html
<!-- index.html -->
<title>__APP_NAME__</title>
```

What happens:

- `vite dev`: loads `.env.development`, replaces `__APP_NAME__` with `My App`, opens the browser, mirrors tsconfig paths.
- `vite build`: loads `.env.production`, sets `config.base = "https://cdn.example.com/"`, replaces `__APP_NAME__`, zips `dist/`.

## Production CDN base URL via env

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

```sh
vite build   # → assets referenced from https://assets.example.com/
```

## Apache deployment with .htaccess + prerender

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

Drop the zip on an Apache box, unzip into the docroot, and SPA routing + crawler pre-rendering both work without further config.

## Multi-stage builds (staging / production / preprod)

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [
    mongezVite({
      productionEnvName: process.env.STAGE,
    }),
  ],
});
```

```sh
STAGE=staging vite build    # loads .env.staging
STAGE=preprod vite build    # loads .env.preprod
STAGE=production vite build # loads .env.production
```

Without `STAGE`, `productionEnvName` is `undefined` and the plugin falls through to the default chain (`.env.production` → `.env.build` → `.env`).

## Disable everything except env + base + index.html

```ts
mongezVite({
  autoOpenBrowser: false,
  linkTsconfigPaths: false,
  compressBuild: false,
  htaccess: false,
});
```

The plugin reduces to: load env, set `config.base` during build, replace `__KEY__` tokens in `index.html`. Useful when you already have other plugins handling tsconfig paths, compression, and dev-server behaviour.

## Custom html token delimiters

```ts
mongezVite({
  htmlEnvPrefix: "<!-- ",
  htmlEnvSuffix: " -->",
});
```

```html
<title><!-- APP_NAME --></title>
```

Use HTML-comment-shaped tokens when your HTML is processed by a tool that strips `__double_underscores__` (rare, but it happens).

## Custom build artifact name

```ts
mongezVite({
  compressedFileName: () => {
    const tag = process.env.GIT_TAG || "latest";
    return `myapp-${tag}.zip`;
  },
});
```

```sh
GIT_TAG=v1.4.2 vite build
# → dist/myapp-v1.4.2.zip
```

For an async lookup:

```ts
mongezVite({
  compressedFileName: async () => {
    const tag = await readVersionFromS3();
    return `myapp-${tag}.zip`;
  },
});
```

## Layered env with shared defaults

```bash
# .env.shared
APP_NAME="My App"
APP_URL=https://example.com

# .env.development
DB_HOST=localhost
DEBUG=true

# .env.production
DB_HOST=prod-db.example.com
DEBUG=false
PUBLIC_URL=https://cdn.example.com/
```

```ts
mongezVite();
```

What happens:

- `vite dev`: `.env.shared` loads first, then `.env.development`. `APP_NAME` survives from shared; `DB_HOST` and `DEBUG` come from dev.
- `vite build`: `.env.shared` first, then `.env.production`. Same idea.

This is `@mongez/dotenv`'s default — `loadEnv` is called with `loadSharedEnv: true`.

## SPA + tsconfig paths

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
mongezVite();   // linkTsconfigPaths: true (default)
```

```ts
import App from "@/App";
import Button from "@components/Button";
import { foo } from "@lib";
```

Both `tsc` and Vite resolve the imports. No second plugin needed.

## Reading the loaded env from app code

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [mongezVite()],
});
```

```ts
// src/config.ts — runs at build / dev time
import { env } from "@mongez/dotenv";

// loadEnv was already called from inside the plugin's config hook, so the
// store is populated by the time vite reaches user code.
export const config = {
  appName: env("APP_NAME") as string,
  port: env("APP_PORT", 3000) as number,
  debug: env("DEBUG", false) as boolean,
};
```

> Note: this is for code that runs at build/dev time (e.g. inside `vite.config.ts`'s own imports or pre-bundling plugins). Code that ships to the browser cannot read from `@mongez/dotenv`'s store at runtime — use Vite's own `import.meta.env.VITE_*` mechanism for that. To expose a value as `import.meta.env.VITE_*`, prefix it with `VITE_` in your `.env` file.

## Apache deploy script

```sh
#!/bin/bash
# deploy.sh
set -e

STAGE=${1:-production}

# Build with the matching .env file
STAGE=$STAGE vite build

# Ship the zip — compressBuild awaits the archive pipeline inside writeBundle,
# so by the time `vite build` exits, dist/build.zip is finalised on disk.
scp dist/build.zip server:/var/www/$STAGE-staging.zip
ssh server "cd /var/www && unzip -o $STAGE-staging.zip -d $STAGE"
```

If you'd rather zip the output dir yourself (different archive format, additional files, etc.), disable `compressBuild`:

```ts
mongezVite({ compressBuild: false });
```

```sh
vite build && cd dist && zip -r build.zip ./* && scp build.zip server:...
```
