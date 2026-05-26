---
name: mongez-vite-production-base-url
description: |
  How @mongez/vite reads an env variable during vite build and writes it into config.base so assets are referenced from the correct CDN or subpath URL.
  TRIGGER when: code passes `envBaseUrlKey` (or relies on the default `PUBLIC_URL`) to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; `.env.production` / `.env.<stage>` declares `PUBLIC_URL` or a custom CDN key alongside `mongezVite()` registered; user asks "how do I set Vite's base URL from env", "why do production assets load from the wrong origin / 404 from `/assets/...`", "how do I deploy a Vite SPA behind a CDN or subpath".
  SKIP: dev-server base behaviour (the plugin never touches `config.base` during `serve`); hand-setting `base` in `vite.config.ts` (the plugin defers to that); `MongezViteOptions.baseUrl` (currently informational — set `base` on the Vite config directly); env file resolution itself (use `mongez-vite-env-loading`).
---

# Production base URL

Setting `config.base` correctly is the difference between assets that load from `/assets/...` (relative to the deploy origin) and assets that load from `https://cdn.example.com/assets/...` (from your CDN). `@mongez/vite` reads an env variable during build and writes it into `config.base` for you.

## Default behaviour

```ts
mongezVite();   // envBaseUrlKey defaults to "PUBLIC_URL"
```

```bash
# .env.production
PUBLIC_URL=https://cdn.example.com
```

After `vite build`:

- `config.base = "https://cdn.example.com/"` (trailing slash normalised in).
- Built `index.html` references assets at `https://cdn.example.com/assets/index-<hash>.js`.

## Choosing a different env key

```ts
mongezVite({ envBaseUrlKey: "CDN_HOST" });
```

```bash
# .env.production
CDN_HOST=https://static.example.com
```

The plugin reads `env("CDN_HOST")` instead of `env("PUBLIC_URL")`.

## Normalisation rules

| Input value | Resulting `config.base` |
|---|---|
| `https://cdn.example.com` | `https://cdn.example.com/` |
| `https://cdn.example.com/` | `https://cdn.example.com/` |
| `https://cdn.example.com///` | `https://cdn.example.com/` |
| `https://cdn.example.com/app` | `https://cdn.example.com/app/` |
| `https://cdn.example.com/app/` | `https://cdn.example.com/app/` |
| (env unset) | `/` |

The normalisation uses `rtrim(value, "/") + "/"` — strip all trailing slashes, then add exactly one back.

## When the plugin does NOT touch `config.base`

- **During `vite dev` (`serve`).** Dev mode keeps its own base behaviour.
- **When the user already set `config.base`.** Your `vite.config.ts` wins:
  ```ts
  export default defineConfig({
    base: "/my-app/",
    plugins: [mongezVite()],
  });
  // → config.base stays "/my-app/", regardless of PUBLIC_URL.
  ```

## The `baseUrl` option

`MongezViteOptions.baseUrl` exists as a typed alias for an inline value, but the source today derives `config.base` exclusively from `env(envBaseUrlKey)`. To set a static base from `vite.config.ts`, set `base` on the Vite config directly:

```ts
export default defineConfig({
  base: "https://cdn.example.com/",   // ← here, not in mongezVite
  plugins: [mongezVite()],
});
```

The `baseUrl` option on the plugin is currently informational / forward-compatible.

## When env is unset

If `env(envBaseUrlKey)` returns `undefined` during build (no `.env.production` matched, or the key isn't in the file), the plugin falls back to `"/"`. Vite's own default is also `"/"`, so the practical effect is: assets are referenced relative to the deploy origin.

```ts
// No .env.production file, or PUBLIC_URL unset
mongezVite();
// → config.base = "/"
```

This is the "I'm hosting the SPA at the root of a domain" path.

## Gotchas

- **Vite reads `config.base` at config-resolution time.** The plugin's `config` hook runs *before* Vite locks in the base, so the env value lands in time.
- **Don't expect dev parity.** Even if `PUBLIC_URL=https://cdn.example.com` is set in `.env.development`, the plugin still doesn't touch `config.base` during `vite dev`. Dev mode serves from `localhost:5173`.
- **Subpath bases need a final slash.** `https://example.com/app` becomes `https://example.com/app/`. If your CDN's path matters character-for-character, double-check that the trailing slash is what you wanted.
