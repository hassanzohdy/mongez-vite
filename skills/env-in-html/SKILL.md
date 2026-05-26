---
name: mongez-vite-env-in-html
description: |
  How @mongez/vite replaces __KEY__-style tokens in index.html with env values via its transformIndexHtml hook, including custom delimiters and gotchas.
  TRIGGER when: code passes `htmlEnvPrefix` or `htmlEnvSuffix` to `mongezVite({...})` in `vite.config.ts` / `vite.config.js`; `index.html` contains `__KEY__`-style tokens (or custom-delimited `{{KEY}}` / `<!--KEY-->` shapes) paired with `mongezVite()` in `plugins: []`; user asks "how do I inject env values into index.html", "why are my `__APP_NAME__` tokens not being replaced", "how do I change the env token delimiters in HTML".
  SKIP: env file resolution / `productionEnvName` (use `mongez-vite-env-loading`); reading env values at runtime in the browser (that's Vite's `import.meta.env.VITE_*`, not `@mongez/vite`); HTML transforms unrelated to env tokens; generic templating engines (EJS, Handlebars) not driven by `mongezVite`.
---

# Env in HTML

`@mongez/vite` registers a `transformIndexHtml` hook that replaces `<prefix><KEY><suffix>`-style tokens in every emitted HTML file with the corresponding env value.

## How it works

1. Vite calls the hook with the raw HTML string of each `*.html` it's about to emit.
2. The hook iterates over every key in the `@mongez/dotenv` env store and runs:
   ```ts
   html = html.replace(new RegExp(`${prefix}${key}${suffix}`, "g"), value);
   ```
3. Keys that have no token in the HTML pass through silently. Tokens that don't match any key are left in the output unchanged.

## Defaults

| Option | Default |
|---|---|
| `htmlEnvPrefix` | `"__"` (double underscore) |
| `htmlEnvSuffix` | `"__"` (double underscore) |

## Usage

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="__APP_DEFAULT_LOCALE__" dir="__APP_DEFAULT_DIRECTION__">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="__APP_FAV_ICON__" />
    <meta name="theme-color" content="__APP_PRIMARY_COLOR__" />
    <meta name="description" content="__APP_DESCRIPTION__" />
    <title>__APP_NAME__</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```bash
# .env.production
APP_NAME="My App"
APP_DEFAULT_LOCALE=en
APP_DEFAULT_DIRECTION=ltr
APP_FAV_ICON=/favicon.svg
APP_PRIMARY_COLOR=#0066ff
APP_DESCRIPTION="A web app"
```

After `vite build`, `dist/index.html`'s `<title>` is `My App`, `<html lang>` is `en`, etc.

## Custom delimiters

```ts
mongezVite({
  htmlEnvPrefix: "{{",
  htmlEnvSuffix: "}}",
});
```

```html
<title>{{APP_NAME}}</title>
```

The prefix/suffix are spliced directly into a `RegExp` constructor, so regex metacharacters like `{`, `}`, `(`, `)` need to either be regex-safe or you accept that they're interpreted as regex. Plain `__`, `{{...}}` (with `\{\{...\}\}` if you write them as a config value), and `<!--KEY-->` shapes all work — pick something that won't appear naturally in your HTML.

## Type coercion in HTML

Env values are coerced to typed primitives during load (number / boolean / null / string). Substitution stringifies them implicitly:

```bash
# .env.production
APP_PORT=3000
DEBUG=true
```

```html
<meta name="port" content="__APP_PORT__" />
<meta name="debug" content="__DEBUG__" />
```

Result:

```html
<meta name="port" content="3000" />
<meta name="debug" content="true" />
```

## Gotchas

- **Tokens for unknown keys are left intact.** This is by design — there's no warning when a token doesn't match. If you see `__APP_NAME__` in your shipped HTML, the env variable wasn't loaded.
- **URL attribute parsers don't like `%` or `$`.** Vite's HTML transform parses `<link href>` and `<script src>` as URLs before our hook runs. If you use `%KEY%` or `$KEY$` as delimiters, those characters fail URL parsing on tag attributes. Stick to `__KEY__`, `{{KEY}}`, or `<!--KEY-->`.
- **The hook runs on every emitted HTML file.** If your build emits multiple HTML entry points, env tokens are replaced in each.
- **No escaping.** If your env value contains `<` or `&`, it's spliced verbatim into the HTML. Don't put untrusted input through this transform.
