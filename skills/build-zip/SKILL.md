---
name: mongez-vite-build-zip
description: How @mongez/vite zips the Vite build output directory after a successful build, including custom filenames, output location, the known setTimeout race condition, and how to opt out.
when_to_use: User wants to zip the Vite build output, user is configuring compressBuild or compressedFileName, user encounters a missing or partial zip file after vite build, user is scripting a deploy pipeline that depends on the zip artifact.
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

## Sharp edge: the setTimeout race

`compressBuild`'s implementation wraps its work in a `setTimeout(..., 1000)` and returns immediately. Vite considers the `writeBundle` handler done before the zip exists.

```ts
// Inside compressBuild:
setTimeout(async () => {
  // ... archive.pipe(output); await archive.finalize(); moveFile(...);
}, 1000);
```

Consequences:
- A wrapper script that runs `vite build && upload.sh` may shell out before the zip is finalised, picking up either a partial file or nothing.
- Test runners that mock the filesystem won't see the writes.

Workarounds:

```sh
# 1. Sleep before the next step.
vite build && sleep 3 && upload.sh

# 2. Watch for the file to settle.
vite build && wait-for-file dist/build.zip && upload.sh

# 3. Don't use compressBuild; zip yourself.
vite build && cd dist && zip -r build.zip ./*
```

This bug is documented in `src/__tests__/known-bugs.test.ts`.

## What's inside the zip

Everything Vite emitted into `outDir`, including:

- `index.html`
- `assets/*.js`, `assets/*.css`
- Any static files Vite copied over from `public/`
- The `.htaccess` (if `htaccess: true` ran first)
- The `prerender.php` (if `preRender` is set)

The zip itself is added to `outDir` after Vite finishes, but because of the setTimeout the zip does NOT contain itself — it captures the output dir state from before the move.

## Gotchas

- **The zip moves into `outDir` after creation.** If your `outDir` is symlinked or behind a read-only mount, the move fails silently (the underlying `moveFile` call from `@mongez/fs` swallows the error).
- **`compressBuild` always emits zip format.** Other archive formats aren't supported. Use a separate tool if you need `.tar.gz` or similar.
- **The function form runs once per build.** Filenames that depend on `Date.now()` produce a stable name across the build but new on each invocation.
