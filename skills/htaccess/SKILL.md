---
name: mongez-vite-htaccess
description: |
  How @mongez/vite generates and writes an Apache .htaccess file into the build output for SPA routing, HTTPS enforcement, compression, and cache headers.
  TRIGGER when: code passes `htaccess: true` to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; project deploys a Vite SPA to Apache and ships a `.htaccess` with `RewriteEngine On` / SPA fallback rules; user asks "how do I generate `.htaccess` for my Vite SPA", "what's inside the mongezVite `.htaccess` template", "how do I add SPA rewrite rules / force HTTPS / GZIP on Apache".
  SKIP: prerender PHP and the crawler rewrite that lives inside `.htaccess` (use `mongez-vite-prerender`); Nginx / Caddy / Cloudflare Workers SPA routing (Apache-specific); customising cache headers per filetype beyond what the bundled template ships (post-process the emitted file); raw `.htaccess` authoring with no `mongezVite()` plugin in the config.
---

# `.htaccess` generation

For Apache-hosted SPAs, you need a `.htaccess` that:

- Routes every non-asset URL back to `index.html` so client-side routing works.
- Forces HTTPS.
- Compresses responses.
- Sets sane cache headers.

`@mongez/vite` ships a bundled `.htaccess` template and writes it into the output directory when you opt in.

## Default behaviour

```ts
mongezVite();   // htaccess: false (opt-in)
```

The default is `false` — you have to opt in explicitly.

## Opting in

```ts
mongezVite({ htaccess: true });
```

After `vite build`, `dist/.htaccess` exists.

## What's in the template

The bundled `.htaccess`:

```apache
RewriteEngine On
Options +FollowSymLinks -Indexes

# Force https
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

RewriteCond %{HTTPS} !on
RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Prerender slot (filled if preRender is set, removed otherwise)

# Skip files that exist
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule \.(jpg|png|ico|jpeg|webp|gif|bmp|webp|svg)$ - [L]
RewriteRule assets/(.*) assets/$1 [L]

# SPA fallback: everything else → index.html
RewriteRule ^(.*)$ index.html [L,QSA]

# GZIP via mod_gzip and mod_deflate
# ... <ifModule mod_gzip.c> ... </ifModule>
# ... <ifModule mod_deflate.c> ... </ifModule>

# 31-day Expires headers for asset types
# ... <ifmodule mod_expires.c> ... </ifmodule>

# Cache-Control headers per file type
# ... <ifmodule mod_headers.c> ... </ifmodule>
```

Each block is wrapped in `<ifModule>` so an Apache install missing one of the modules degrades gracefully.

## The prerender slot

If `preRender` is set, the plugin splices a crawler-routing rewrite block into the template before writing it out:

```apache
# Prerender
RewriteCond %{HTTP_USER_AGENT} .*(Googlebot|facebook|...|bot).* [NC]
RewriteCond %{REQUEST_URI} !^(/public)
RewriteRule (.*) prerender.php [L,QSA]
```

If `preRender: false` (the default), the `# Prerender` marker is replaced with an empty string and no crawler routing happens.

See [`prerender.md`](./prerender.md) for the full prerender pipeline.

## Cache behaviour

The template configures, per filetype:

| Filetype | `Expires` | `Cache-Control` |
|---|---|---|
| `ico`, `flv`, `jpg`, `jpeg`, `png`, `gif`, `css`, `swf` | 31 days | `max-age=2678400, public` |
| `html`, `htm` | 7200s (2h) | `max-age=7200, private, must-revalidate` |
| `pdf` | 31 days | `max-age=2678400, public` |

Tune these by **post-processing** the emitted file in your own deploy step — the plugin does not expose options for them today.

## When the plugin does nothing

- `htaccess: false` (the default).

## Gotchas

- **Asset-name extensions are hard-coded.** The rewrite rule skipping rule lists `(jpg|png|ico|jpeg|webp|gif|bmp|webp|svg)$`. If you emit `.avif` or `.webm`, add a custom rule by post-processing the htaccess, or set `htaccess: false` and write your own.
- **`assets/` is the only build-output subdir whitelisted.** If you customise Vite's `assetsDir` (e.g. `static/`), edit the template.
- **The force-HTTPS rule applies even in dev when Apache is in front of localhost.** Usually you wouldn't deploy with vite dev, but if you do, expect redirects to `https://localhost`.
- **The template lives at `src/.htaccess`** in the package. If you want to customise wholesale, fork or shadow it via your own plugin.
