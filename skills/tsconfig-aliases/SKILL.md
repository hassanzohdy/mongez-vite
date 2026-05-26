---
name: mongez-vite-tsconfig-aliases
description: |
  How @mongez/vite mirrors compilerOptions.paths from tsconfig.json into Vite's resolve.alias so TypeScript path aliases work in both tsc and the Vite dev server without a separate plugin.
  TRIGGER when: code passes `linkTsconfigPaths` or `tsconfigAlias` to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; project has `tsconfig.json` with `compilerOptions.paths` (e.g. `"@/*": ["src/*"]`) alongside `mongezVite()` registered; user asks "why do my `@/...` imports work in tsc but fail in Vite", "how do I sync tsconfig paths with Vite aliases", "how does mongezVite handle `resolve.alias`".
  SKIP: third-party path-alias plugins like `vite-tsconfig-paths` not paired with `@mongez/vite`; hand-written `resolve.alias` arrays in `vite.config.ts` (the plugin defers to those); Webpack / Jest `moduleNameMapper` path resolution; tsconfig `references` / project-references setup.
---

# tsconfig path aliases

TypeScript's `compilerOptions.paths` lets you write `import App from "@/App"` instead of `import App from "../../App"`. Vite doesn't read that out of the box — without help, your TS compiles but the dev server reports "module not found". `@mongez/vite` reads `tsconfig.json` and mirrors `paths` into `resolve.alias` so the two agree.

## Default behaviour

```ts
mongezVite();   // linkTsconfigPaths: true, tsconfigAlias: true
```

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

After the `config` hook runs, `config.resolve.alias` is:

```ts
[
  { find: "@",          replacement: "<cwd>/src" },
  { find: "components", replacement: "<cwd>/src/components" },
  { find: "lib",        replacement: "<cwd>/src/lib/index.ts" },
]
```

Now both `tsc` and Vite resolve:

```ts
import App from "@/App";                  // → <cwd>/src/App
import Button from "components/Button";    // → <cwd>/src/components/Button
import { foo } from "lib";                 // → <cwd>/src/lib/index.ts
```

## How the transform works

For each `[find, value]` entry in `compilerOptions.paths`:

1. `find` has its trailing `/*` stripped (`"@/*"` → `"@"`).
2. `value` is read as `String(value)` — for a single-element array `["src/*"]` this gives `"src/*"`. Its trailing `/*` is also stripped.
3. The replacement is run through `path.resolve(process.cwd(), ...)` to produce an absolute path.

```ts
{
  find: "@",
  replacement: path.resolve(process.cwd(), "src"),
}
```

## Opting out

Set `linkTsconfigPaths: false` to skip:

```ts
mongezVite({ linkTsconfigPaths: false });
```

Use this when:

- You already use `vite-tsconfig-paths` or another plugin that does the same thing.
- You want to define `resolve.alias` by hand in `vite.config.ts`.
- Your `tsconfig.json` `paths` don't translate cleanly (the transform is intentionally simple — see "Gotchas").

## No-overwrite semantics

If you already declared `resolve.alias` in `vite.config.ts`, the plugin does not touch it:

```ts
export default defineConfig({
  resolve: {
    alias: { "@": "/elsewhere" },
  },
  plugins: [mongezVite()],
});
// → resolve.alias stays { "@": "/elsewhere" }, even though tsconfig has
//   "@/*": ["src/*"]
```

This is intentional — explicit config beats inferred config.

## When the plugin does nothing

- `linkTsconfigPaths: false`.
- `tsconfigAlias: false` (separate but tied option — both must be truthy).
- `tsconfig.json` doesn't exist in `process.cwd()`.
- `tsconfig.json` exists but `compilerOptions.paths` is missing or empty.
- `config.resolve.alias` is already set by the user.

## Gotchas

- **Only the first array entry survives** — the transform reads `String(value)` rather than iterating. For `"foo/*": ["src/foo/*", "lib/foo/*"]`, only the join-form is read. Most setups only have one entry per key, so this is rarely a problem.
- **`/*` is stripped exactly once** — the transform calls `.replace("/*", "")` (first occurrence). Nested globs like `"foo/*/*"` would have only the first `/*` stripped.
- **No `extends`-following.** If your `tsconfig.json` extends a base config, the plugin reads only the top file. Re-declare your `paths` at the top level or wire it differently.
- **`baseUrl` is ignored.** The transform always resolves against `process.cwd()`. If your `paths` are written relative to a different `baseUrl`, the resulting aliases won't match.
- **Windows path separators.** `path.resolve` uses native separators (`\` on Windows). Vite handles both, so this isn't user-visible — but tests that string-match the replacement need to normalise.
