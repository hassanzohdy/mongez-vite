---
name: mongez-vite-auto-open-browser
description: |
  How @mongez/vite automatically sets server.open = true during vite dev, when it defers to an explicit user setting, and how to opt out.
  TRIGGER when: code passes `autoOpenBrowser` to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; `vite.config.ts` has both `server: { open: ... }` and `mongezVite()` and the user wants to reconcile them; user asks "how do I stop Vite from auto-opening the browser with mongezVite", "why does my browser open / not open on `vite dev`", "how does mongezVite interact with `server.open`".
  SKIP: pure Vite `server.open` configuration with no `@mongez/vite` plugin in scope; opening a specific path on dev start (the plugin clobbers the string form — user should set `autoOpenBrowser: false`); HMR / dev-server port / host issues; production-build behaviour (the helper short-circuits during `build`).
---

# Auto-open browser

Vite has its own `server.open` flag, but you have to remember to set it in every `vite.config.ts`. `@mongez/vite` flips it on for you during `vite dev` while respecting any explicit setting you've made.

## Default behaviour

```ts
mongezVite();   // autoOpenBrowser: true
```

During `vite dev` (Vite's `serve` command), the plugin sets `config.server.open = true`. During `vite build`, nothing.

## Opting out

```ts
mongezVite({ autoOpenBrowser: false });
// → server.open is not touched
```

## Decision table

| Your `server.open` | Plugin `autoOpenBrowser` | Vite command | Result |
|---|---|---|---|
| unset | `true` (default) | `serve` | Sets `server.open = true` |
| unset | `true` | `build` | Untouched |
| unset | `false` | `serve` | Untouched (you said "no") |
| `false` | `true` | `serve` | Untouched (your explicit `false` wins) |
| `true` | `true` | `serve` | Untouched (already `true`) |
| `true` | `false` | `serve` | Untouched (your `true` survives — option only adds, never removes) |

The rule: **explicit user-set `server.open` always wins**, regardless of `autoOpenBrowser`.

```ts
// vite.config.ts
import mongezVite from "@mongez/vite";

export default defineConfig({
  server: { open: false },          // ← explicit "don't open"
  plugins: [mongezVite({ autoOpenBrowser: true })],  // ← respected: open stays false
});
```

## What "explicit" means

The check is `[false, true].includes(config.server?.open)`. So:

- `server: { open: false }` → explicit false → plugin skips.
- `server: { open: true }` → explicit true → plugin skips (no-op anyway).
- `server: { open: "/some/path" }` → NOT in the literal-boolean list, so the plugin treats it as not-set and overwrites with `true`. (Rare edge case — Vite supports passing a path here.)
- `server: {}` (no `open`) → plugin sets it to `true`.

If you're using the string form to open a specific path, the plugin will clobber it. Workaround: skip the plugin's helper:

```ts
mongezVite({ autoOpenBrowser: false });
```

## When the plugin does nothing

- `command === "build"`. The plugin's helper short-circuits.
- `autoOpenBrowser: false`. 
- `server.open` is already a literal boolean (true or false).
