# Changelog — @mongez/vite

## Unreleased

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

### Dependency notes

- **`@mongez/reinforcements` is pinned to `^2.3.1`** in `dependencies`. The rest of the `@mongez/*` family has moved to `3.x`. The two surfaces this package uses (`rtrim`) are API-compatible across both major versions, so the pin is not blocking — but bumping to `^3.0.0` would align with siblings and avoid a duplicate package in `node_modules` for consumers using both.
- **`vite` is declared as a `peerDependency`** (`>=5.0.0`) and now also as a `devDependency` (`^5.0.0`) so the test suite can resolve it without a containing app providing it.

### Tests

```
70 passed | 0 skipped
```
