---
description: "Configure @mongez/vite's single Vite plugin for the usual SPA workflow: add it to vite.config.ts, load environment values, replace __KEY__ HTML tokens, and create a deployment ZIP. It can also mirror tsconfig paths, set a production base URL, open the dev server, and optionally generate Apache .htaccess and prerender PHP files. Use the focused topics for each option's exact behavior and deployment constraints. Not this package: runtime HTTP, client state, React components, or dotenv parsing without Vite → @mongez/http, @mongez/react-atom, @mongez/dotenv."
---

# @mongez/vite

## The 80% path

Add the plugin once, keep environment-specific values in `.env` files, and use
its defaults for development and builds.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import mongezVite from "@mongez/vite";

export default defineConfig({
  plugins: [mongezVite()],
});
```

```bash
# .env.development
APP_NAME="My App"

# .env.production
APP_NAME="My App"
PUBLIC_URL=https://cdn.example.com
```

```html
<!-- index.html -->
<title>__APP_NAME__</title>
```

`vite dev` loads `.env.development` (then opens the browser unless you set
`server.open` or opt out). `vite build` loads `.env.production`, uses
`PUBLIC_URL` for `base` when your Vite config does not set one, substitutes the
HTML token, and writes `dist/build.zip` by default.

## Configuration topics

- [Overview](./overview/SKILL.md) — plugin scope, defaults, and lifecycle hooks.
- [Environment loading](./env-loading/SKILL.md) — file selection, shared values, and `productionEnvName`.
- [Environment values in HTML](./env-in-html/SKILL.md) — `__KEY__` substitution and custom delimiters.
- [Production base URL](./production-base-url/SKILL.md) — `PUBLIC_URL`, `envBaseUrlKey`, and `config.base` precedence.
- [tsconfig aliases](./tsconfig-aliases/SKILL.md) — mirror `compilerOptions.paths` into Vite aliases.
- [Auto-open browser](./auto-open-browser/SKILL.md) — dev-server opening and opt-out behavior.
- [Build ZIP](./build-zip/SKILL.md) — archive creation, names, and output location.
- [.htaccess](./htaccess/SKILL.md) — Apache SPA rewrites, headers, and generated output.
- [Prerender](./prerender/SKILL.md) — crawler routing through Apache and generated PHP.
- [Recipes](./recipes/SKILL.md) — complete configurations for common deployments.

## Not this package →

- Need to parse or retrieve environment values outside the Vite plugin lifecycle? Use `@mongez/dotenv`.
- Need browser HTTP requests, interceptors, or transport errors? Use `@mongez/http`.
- Need client-side UI or application state? Use `@mongez/react-atom`.
