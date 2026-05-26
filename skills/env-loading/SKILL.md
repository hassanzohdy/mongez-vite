---
name: mongez-vite-env-loading
description: |
  How @mongez/vite loads the correct .env file per Vite command, delegates to @mongez/dotenv for type coercion and shared-env layering, and exposes values via the env() helper.
  TRIGGER when: code configures `mongezVite({ productionEnvName: ... })` in `vite.config.ts` / `vite.config.js`, or imports `env` from `@mongez/dotenv` alongside `mongezVite` usage; user asks "how do I load .env in Vite with mongezVite", "how do I switch between .env.staging / .env.production at build time", "why is my .env not loading"; project has `.env.shared` / `.env.production` / `.env.development` / `.env.build` / `.env.local` files plus `mongezVite()` registered.
  SKIP: in-HTML token replacement (use `mongez-vite-env-in-html`); deriving `config.base` from env (use `mongez-vite-production-base-url`); raw `@mongez/dotenv` usage with no `mongezVite()` plugin in the config; Vite's built-in `loadEnv` / `import.meta.env.VITE_*` without `@mongez/vite`; generic dotenv libraries (`dotenv`, `dotenv-flow`).
---

# Env loading

`@mongez/vite` calls into `@mongez/dotenv` from inside its `config` hook to load the right `.env.<environment>` file for the current Vite command.

## Resolution chain

From `process.cwd()`, the plugin walks one of these chains depending on the command:

| Command (Vite) | File search order |
|---|---|
| `vite build` | `.env.production` → `.env.build` → `.env` |
| `vite dev` (`serve`) | `.env.development` → `.env.local` → `.env` |

Whichever file exists first wins. If none exist, the helper is a no-op.

## The `productionEnvName` override

To lock the build to a specific file name (e.g. `.env.staging`):

```ts
mongezVite({ productionEnvName: "staging" });
```

Effects:
- During `vite build`, loads ONLY `.env.staging`. If missing, the helper returns early — it does NOT fall back to `.env.production` / `.env.build` / `.env`.
- During `vite dev`, the option is ignored; the standard `serve` chain applies.

```ts
// "Build for staging, dev with .env.development as usual"
mongezVite({ productionEnvName: "staging" });
```

```sh
STAGE=staging vite build   # loads .env.staging
vite dev                    # loads .env.development
```

## What `@mongez/dotenv` does to values

The dotenv parser is intentionally narrow about which strings get coerced:

| Input | Output | Type |
|---|---|---|
| `"3000"` | `3000` | `number` |
| `"3.14"` | `3.14` | `number` |
| `"true"` / `"false"` | `true` / `false` | `boolean` |
| `"null"` | `null` | object |
| `"hello"` | `"hello"` | `string` |
| `'"3000"'` (quoted) | `"3000"` | `string` — quotes opt out of coercion |

`${VAR}` interpolation works between keys when the referenced key appears earlier in the file:

```bash
APP_HOST=localhost
APP_PORT=3000
APP_URL=http://${APP_HOST}:${APP_PORT}
```

Result: `env("APP_URL") === "http://localhost:3000"`.

## Reading values back

```ts
import { env } from "@mongez/dotenv";

env("APP_PORT");        // 3000        (typed)
env("DEBUG");           // true        (typed)
env("MISSING", "x");    // "x"         (default fallback)

process.env.APP_PORT;   // "3000"      (string — Node coerces every assignment)
```

The plugin loads with `override: true`, so `process.env` also gets a string-coerced copy of every loaded key. If you want the typed value, go through `env()`.

## `.env.shared` layering

`@mongez/dotenv` defaults to loading `.env.shared` before the environment-specific file. The plugin uses these defaults:

```ts
loadEnv(envPath, {
  override: true,
  loadSharedEnv: true,
});
```

Layering:

```bash
# .env.shared
APP_NAME="My App"
APP_URL=https://example.com

# .env.production
DB_HOST=prod-db.example.com
DEBUG=false
```

After load:
- `env("APP_NAME")` → `"My App"` (from shared).
- `env("DEBUG")` → `false` (from production).

If a key appears in both, the environment-specific file wins.

## Gotchas

- **`process.cwd()` is the only resolution root.** Run `vite` from the project root; from a subdirectory the files won't be found.
- **No fallback when `productionEnvName` is set.** If you set `productionEnvName: "staging"` and forget to create `.env.staging`, the loader silently does nothing.
- **No event when the load completes.** The plugin loads env files inside the `config` hook, which runs once. After that, env values are static until the next vite restart.
- **`env()` preserves a deliberately-loaded `null`.** `@mongez/dotenv`'s `env()` uses `key in envData` rather than `??`, so a value of literal `null` reads back as `null` (not the supplied default). If you only want the default when the key is missing, that behaviour is now correct.
