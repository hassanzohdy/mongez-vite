---
name: mongez-vite-build-zip
description: |
  How @mongez/vite zips the Vite build output directory after a successful build, including custom filenames, output location, the known setTimeout race condition, and how to opt out.
  TRIGGER when: code passes `compressBuild` or `compressedFileName` (string / sync / async function) to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; deploy script chains `vite build && <something with dist/build.zip>`; user asks "how do I zip Vite output for deploy", "why is `dist/build.zip` missing or partial after `vite build`", "how do I name the zip per git tag / build number".
  SKIP: `.htaccess` generation (use `mongez-vite-htaccess`); prerender PHP emission (use `mongez-vite-prerender`); other archive formats like `.tar.gz` (this plugin emits zip only — script it yourself); generic Node zip libraries (`archiver`, `adm-zip`) used without `@mongez/vite`.
---

# Build zip

After a successful `vite build`, `@mongez/vite` can package the entire output directory into a single zip file ready for shipping. The typical Mongez deploy is `vite build && scp dist/build.zip server:/var/www/`.

## Default behaviour

```ts
mongezVite();   // compressBuild: true, compressedFileName: "build.zip"
```

After `vite build`:

```
dist/
├── assets/
│   └── index-<hash>.js
├── index.html
└── build.zip          ← contains everything else above
```

The zip contains the **contents** of the output directory, not the directory itself. Unzipping at the destination drops the files in directly.

## Opting out

```ts
mongezVite({ compressBuild: false });
```

The post-build zip step is skipped entirely. Everything else (`.htaccess`, `prerender.php`, env loading, etc.) still runs.

## Custom filename

### Static string

```ts
mongezVite({ compressedFileName: "myapp.zip" });
```

### Sync function

```ts
mongezVite({
  compressedFileName: () => `myapp-${process.env.BUILD_NUMBER}.zip`,
});
```

### Async function

```ts
mongezVite({
  compressedFileName: async () => {
    const tag = await readVersionTag();
    return `myapp-${tag}.zip`;
  },
});
```

The function is awaited inside the `writeBundle` handler. Use this for any filename that needs an external lookup (git tag, deploy ID, build timestamp from a service).

## Output location

The zip ends up inside the build output directory:

- `compressBuild` reads `config.build?.outDir || "dist"`.
- Creates the zip at `<cwd>/<filename>`.
- Moves it to `<cwd>/<outDir>/<filename>`.

For a custom `outDir`:

```ts
export default defineConfig({
  build: { outDir: "build" },
  plugins: [mongezVite()],
});
// → produces build/build.zip
```

## Awaited writeBundle

`compressBuild` runs inside Vite's `writeBundle` hook with `sequential: true` and awaits the archive pipeline directly. By the time `vite build` exits, `<outDir>/<filename>` is on disk and chained scripts (`vite build && upload.sh`) see the finalised zip.

## What's inside the zip

Everything Vite emitted into `outDir`, including:

- `index.html`
- `assets/*.js`, `assets/*.css`
- Any static files Vite copied over from `public/`
- The `.htaccess` (if `htaccess: true` ran first)
- The `prerender.php` (if `preRender` is set)

The zip itself is created at `<cwd>/<filename>` (outside `outDir`) and then moved into `outDir` after the archive finalises, so the zip does NOT contain itself — it captures the output-dir state from before the move.

## Gotchas

- **The zip moves into `outDir` after creation.** If your `outDir` is symlinked or behind a read-only mount, the move fails silently (the underlying `moveFile` call from `@mongez/fs` swallows the error).
- **`compressBuild` always emits zip format.** Other archive formats aren't supported. Use a separate tool if you need `.tar.gz` or similar.
- **The function form runs once per build.** Filenames that depend on `Date.now()` produce a stable name across the build but new on each invocation.
