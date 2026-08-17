# Changelog — @mongez/vite

## [2.2.0] — 2026-08-17

Security release. The prerender fix is the important one: the generated `prerender.php` is a file you **deploy to production**, and the previous template interpolated build-time config into PHP source unescaped. Anyone shipping `preRender` should upgrade and regenerate.

### Security

- **Remote code execution in the generated `prerender.php`** (`src/prerender.ts`). `preRender.url`, `preRender.delay` and `preRender.cache` were pasted into the PHP template as raw source text, so a value containing a quote closed the string literal and everything after it was executed as PHP on the deployed server. The values reach the template from `vite.config.ts` and, in the common setup, from an env var (`PRERENDER_URL`) — i.e. from a CI variable or an `.env` file, not necessarily from the person reading the config. Each value is now encoded for the position it lands in: strings via `var_export`-style quoting, `delay`/`cache` coerced to integers. **`CURLOPT_SSL_VERIFYPEER` / `CURLOPT_SSL_VERIFYHOST` are now enabled** in the same file — the template previously disabled TLS verification outright, so the prerendered HTML served to crawlers could be substituted by anyone on the path between the server and the prerender service.
- **Newline injection into `.htaccess`** (`src/generateHtaccess.ts`). The `crawlers` option was interpolated into a `RewriteCond` line verbatim; a value containing a newline could terminate the condition and append arbitrary Apache directives to the deployed `.htaccess`. Newlines and `.htaccess` metacharacters are now stripped from the value, and an empty/whitespace-only result falls back to `DEFAULT_CRAWLERS` rather than emitting a condition that matches everything.
- **Path traversal in `compressBuild`** (`src/compressBuild.ts`). The zip file name came from config and was joined onto the build directory unchecked, so `../../deploy.zip` wrote outside `outDir`. The name is now reduced to its `path.basename`, containing the write to the build directory.

### Changed

- **Env values substituted into `index.html` are now HTML-escaped** (`src/resolve-env-in-htm.ts`). `{{ VITE_X }}` placeholders were replaced with the raw env value, so an env var carrying markup (`</title><script>…`) became live HTML in the built page — a stored-XSS path for anyone who can set a build-time variable. Values are now escaped (`&`, `<`, `>`, `"`, `'`) before substitution, and the replacement is literal: a `$&` or `$1` inside a value is no longer interpreted as a regex replacement pattern. **Behaviour note:** if you were intentionally injecting markup through an env placeholder, it now renders as text. Emit that markup from `index.html` itself instead.

## [2.1.4] — 2026-05-26

### Added

- **Marketing-style README**. Drop-in `vite.config.ts` examples, an option-by-option reference table, the env-file resolution chain, a full options reference, a Caveats section, and worked examples for minimal SPA setup, CDN base URL via env, Apache `.htaccess` + prerender deploy, multi-stage builds, and env-only mode.
- **`llms.txt` / `llms-full.txt`**. AI-discoverable index and concatenated reference matching the `@mongez/atom` shape so the docs aggregator picks them up.
- **`skills/` folder**. Reference cards for tool-assisted development — `README` (index), `overview` (pitch + mental model), per-feature cards (`env-loading`, `env-in-html`, `tsconfig-aliases`, `auto-open-browser`, `production-base-url`, `build-zip`, `htaccess`, `prerender`), and `recipes` (cross-feature compositions and worked `vite.config.ts` files).
- **Vitest test suite**. 70 passing assertions across ten test files covering the plugin factory shape, default options table, in-HTML env interpolation, the dev-server browser auto-open helper, tsconfig path mirroring, `.env.<env>` file resolution per command, the `productionEnvName` override, production base URL derivation, optimizeDeps installation, the prerender PHP template, an integration test that drives the full `config()` hook with chdir'd fixture directories, and regression guards for the four bugs fixed below.
- **CI workflow**. GitHub Actions matrix matching the rest of the `@mongez/*` family: Node 18 / 20 / 22 on Ubuntu, plus Node 20 on Windows.
- **Vitest config**. Self-detecting sibling-alias pattern — when run inside the monorepo it resolves `@mongez/events`, `@mongez/reinforcements`, and `@mongez/dotenv` to the sibling sources for live cross-package edits; in CI / standalone checkouts those aliases are dropped and resolution falls back to `node_modules`.
- **`package.json` polish**. Expanded `description` (now lists every feature, not just "manage development and build process"), `sideEffects: false` for tree-shaking by downstream consumers (note: the package is itself a Vite plugin so this is mostly informational), additional `keywords` for npm searchability (`vite-plugin`, `spa`, `single-page-application`, `htaccess`, `prerender`, etc.), `test` / `test:watch` scripts wired to vitest, and `vite` + `vitest` added under `devDependencies` so the package can `yarn install` standalone.

### Fixed

Each was reproduced as a `.skip()` test in `src/__tests__/known-bugs.test.ts`; the tests have been unskipped and now assert the fix:

- **`src/generateHtaccess.ts:1` — `import { MongezViteOptions } from ".types"`** (missing slash). Survived runtime because the import is type-only and esbuild elides it, but `tsc --noEmit` against the source would fail. Fixed: import now reads `from "./types"`.
- **`src/compressBuild.ts` scheduled the zip job in `setTimeout(..., 1000)`** despite `writeBundle` being declared `sequential: true`. Vite considered the handler done before the zip was created — consumers running `vite build && upload-dist.sh` could upload an incomplete artifact. Fixed: dropped the `setTimeout` wrapper. The function now awaits the archive pipeline directly, so by the time `compressBuild()` resolves the zip is on disk. Backward-compatible: Vite's `writeBundle` hook supports async returns natively.
- **`preRender.url` had no default and no runtime guard** — passing `preRender: {}` interpolated the literal string `undefined` into both the rewrite rule and the generated `prerender.php`. Fixed: `generateHtaccess()` now throws a descriptive build-time error if `preRender` is truthy but `preRender.url` is missing. The throwing approach (rather than tightening the TypeScript type) catches the bug at runtime for JS consumers too.
- **Legacy README naming: `envPrefix` / `envSuffix`**. Older revisions documented option keys that the runtime never read; the source reads `htmlEnvPrefix` / `htmlEnvSuffix`. Fixed: the README and `skills/env-in-html.md` use the correct names. A regression-guard test asserts the doc surfaces stay in sync.

### Changed

- **`vite` is declared as a `peerDependency`** (`>=5.0.0`) and now also as a `devDependency` (`^5.0.0`) so the test suite can resolve it without a containing app providing it.

### Tests

```
70 passed | 0 skipped
```
