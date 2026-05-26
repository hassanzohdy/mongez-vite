---
name: mongez-vite-prerender
description: |
  How @mongez/vite emits a prerender.php and adds a crawler-routing rewrite to .htaccess so bots receive server-rendered HTML while real users get the SPA.
  TRIGGER when: code passes a `preRender: { url, crawlers?, delay?, cache? }` object to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; project pairs `htaccess: true` with bot/SEO crawler concerns (Googlebot, facebookexternalhit, WhatsApp, Slack, Twitter); user asks "how do I prerender for crawlers in a Vite SPA", "how does the `prerender.php` work / what does it do", "how do I route bots to a render service like render.mentoor.io".
  SKIP: the `.htaccess` template itself (use `mongez-vite-htaccess` — note `preRender` requires `htaccess: true`); Nginx / non-Apache prerender pipelines (this emits a PHP file gated by `.htaccess` rewrites); SSR frameworks like Next.js / Remix / vite-plugin-ssr; client-side hydration concerns.
---

# Pre-render

Client-rendered SPAs are invisible to most crawlers — Googlebot has been less of a problem in recent years, but Facebook, WhatsApp, Slack, Twitter, and most non-Google indexers still expect server-rendered HTML. `@mongez/vite` can emit a `prerender.php` and add a rewrite rule to the `.htaccess` so bot user-agents get a pre-rendered version while humans hit your SPA directly.

## Default behaviour

```ts
mongezVite();   // preRender: false (opt-in)
```

No `prerender.php` is emitted. No crawler routing is added to the `.htaccess`.

## Opting in

```ts
mongezVite({
  htaccess: true,     // required — the rewrite rule lives here
  preRender: {
    url: "https://render.mentoor.io",
    crawlers: "Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter",
    delay: 5000,
    cache: false,
  },
});
```

## Options

| Key | Type | Default | What it does |
|---|---|---|---|
| `url` | `string` | — (required) | The external prerender service to fetch from. Receives the visited URL as a query param and returns rendered HTML. |
| `crawlers` | `string` | `Google-Site-Verification\|Googlebot\|facebook\|crawl\|WhatsApp\|bot\|Slack\|Twitter\|bot` | Pipe-separated regex alternation of user-agent fragments. Matched case-insensitively against `User-Agent` header. |
| `delay` | `number` | `5000` | Milliseconds to tell the prerender service to wait before rendering — lets your SPA finish loading data before HTML is captured. |
| `cache` | `boolean` | `false` | When truthy, the generated PHP caches each rendered URL under `<outDir>/cache/<sha1(url)>.html`. |

## The generated `prerender.php`

```php
<?php

function get_content($URL) {
  $hashedUrl = sha1($URL);
  $cachedPagesDirectory = __DIR__ . '/cache';
  $cachedFile = $cachedPagesDirectory . '/' . $hashedUrl . '.html';

  if (file_exists($cachedFile)) {
    $file = file_get_contents($cachedFile);
    if ($file) return $file;
  }

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_URL, $URL);
  $data = curl_exec($ch);
  curl_close($ch);

  if (!file_exists($cachedPagesDirectory)) {
    mkdir($cachedPagesDirectory, 0777, true);
  }
  file_put_contents($cachedFile, $data);
  return $data;
}

$prerenderUrl = '<your prerender URL>';
$url = $_SERVER['SCRIPT_URI'] ?? ...;
$userAgent = $_SERVER['HTTP_USER_AGENT'];

$params = [
  'url' => $url,
  'delay' => <delay>,
  'cache' => <cache>,
  '__agent' => $userAgent,
];

$url = "$prerenderUrl?" . http_build_query($params);
$content = get_content($url);
echo $content;
```

It always writes to the cache directory regardless of the `cache` option — `cache: true` just enables the read path. If you don't want any caching, delete the cache directory after each deploy or wrap the script.

## The htaccess rewrite

When `preRender` is set, the `.htaccess` includes:

```apache
# Prerender
RewriteCond %{HTTP_USER_AGENT} .*(<crawlers>).* [NC]
RewriteCond %{REQUEST_URI} !^(/public)
RewriteRule (.*) prerender.php [L,QSA]
```

So any request whose `User-Agent` matches the crawler list (and doesn't start with `/public`) is routed to `prerender.php` instead of falling through to the SPA's `index.html`.

## Worked example

```ts
mongezVite({
  htaccess: true,
  preRender: {
    url: "https://render.mentoor.io",
    cache: true,
  },
});
```

After `vite build`:

```
dist/
├── .htaccess          ← contains the prerender rewrite
├── prerender.php      ← proxies to https://render.mentoor.io
├── cache/             ← created lazily on first crawler hit
└── ...
```

A request from Googlebot:
1. Hits `dist/`.
2. The `.htaccess` matches `User-Agent: Googlebot...` and rewrites to `prerender.php`.
3. `prerender.php` checks `cache/<sha1>.html`. On cache miss it fetches `https://render.mentoor.io?url=...&delay=5000&cache=1&__agent=Googlebot/...`.
4. The response is cached and returned.

A request from a real user agent (`Mozilla/...`):
1. Hits `dist/`.
2. The `.htaccess` does not match the crawler list and falls through to the SPA rewrite (`index.html`).
3. The SPA renders normally.

## Sharp edges

- **`preRender.url` is required when `preRender` is enabled.** `defaultOptions.ts` has `preRender: false`, and there is no implicit default for `url`. If you set `preRender: {}` without `url`, `generateHtaccess()` throws a descriptive build-time error (`preRender.url is required when preRender is enabled`). Always set `url` explicitly.
- **Requires `htaccess: true`.** The PHP is emitted regardless, but without the rewrite rule it sits there unreachable.
- **No Apache means no prerender.** This pipeline is Apache-specific (`.htaccess` + PHP). Nginx / Caddy hosts need a different strategy.
- **The cache directory is created lazily** by the PHP. Make sure the web server has write permission to `<outDir>/cache/`.
- **`__agent` is forwarded to the service** so its rendering can detect the original crawler. Whether your service uses it depends on its implementation.
