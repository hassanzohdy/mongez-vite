# Mongez Vite

Mongez Vite is a vite plugin that helps you to create a vite project with a lot of features with one plugin.

## Features

- ✅ [Autoload Environment Variables](#auto-lad-env-variables)
- ✅ [Production Base Url](#production-base-url)
- ✅ [Auto Open Browser](#auto-open-browser)
- ✅ [Use Env Variables In index.html file](#use-env-variables-in-indexhtml)
- ✅ [Link tsconfig paths to vite aliases](#link-tsconfig-paths-to-vite)
- ✅ [Auto compress build directory](#auto-compress-build-directory-contents)
- ✅ [Auto Generate Htaccess File](#generate-htaccess)
- ✅ [Auto Inject Pre Render Service](#pre-render-service)

## Installation

`yarn add @mongez/vite`

Or

`npm i @mongez/vite`

## Usage

Just import the plugin and put it in the plugins list.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [mongezVite(), react()],
  } as UserConfigExport;
});
```

## Production Base Url

You can set the production base url by adding the `PUBLIC_URL` environment variable in your `.env.production` file.

```bash
#.env.production
PUBLIC_URL=https://example.com
```

You can also set the production base url by adding the `baseUrl` option in the `mongezVite` plugin.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        baseUrl: "https://example.com",
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

Also you can assign the env variable to the production url by adding the `envBaseUrlKey` option in the `mongezVite` plugin.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        envBaseUrlKey: "PUBLIC_URL",
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

## Auto Open Browser

I know this is already a feature in vite, but I wanted to make it automated xD, you can enable or disable it by setting the `autoOpenBrowser` option to `true` or `false` in the plugin options.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        autoOpenBrowser: true,
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

## Auto Lad Env Variables

By default Mongez Vite will try to load the proper env file based on the available .env file, it will try to find the following:

In Build mode: it will try to find `.env.production` file, if not found it will try to find `.env.build` file, if not found it will try to find `.env` file.

In Development mode: it will try to find `.env.development` file, if not found it will try to find `.env` file.

However, you can specify the production env name, (**just the name of the file without the extension**) by adding `productionEnvName` property to the plugin options.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        productionEnvName: "production",
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

This will make the plugin to load `.env.production` file in build mode.

## Use Env Variables In index.html

You can use env variables in your index.html file, just add the env variables in your .env file and use them in your index.html file.

```html
<!DOCTYPE html>
<html lang="__APP_DEFAULT_LOCALE_CODE__" dir="__APP_DEFAULT_DIRECTION__">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="__APP_FAV_ICON__" />
    <link rel="apple-touch-icon" href="__APP_FAV_ICON__" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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

Here we can use any .env variable in our index.html file, just prefix the variable with `__` and suffix it with `__` and you're done!

You can define env prefix and suffix in the plugin options.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        envPrefix: "__",
        envSuffix: "__",
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

> Be aware of tags that have a url such as `link` and `script` tags, do not use prefix like % or $, this will result an error from vite as it can not parse it as valid url characters.

## Link Tsconfig paths to vite

By default Mongez Vite will try to load all `paths` in `tsconfig.json` file automatically, however, you can disable this feature by setting `linkTsconfigPaths` option to `false`.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/
export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        linkTsconfigPaths: false,
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

> Please note this feature sets the `resolve.alias` option in vite, so if you set this option in your vite config, it will be disabled by default, it's recommended to use only tsconfig paths.

## Auto Compress Build Directory Contents

By default Mongez Vite will compress the build directory contents, however, you can disable this feature by setting `compressBuild` option to `false`.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/

export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        compressBuild: false,
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

The generated zip file will be named as `build.zip` and will be located in the `dist` directory of your project or in the `buildDir` directory if you set it in the config options.

However, you can change the compressed file name by setting `compressedFileName` option to the desired name.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/

import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/

export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        compressBuild: true,
        compressedFileName: "my-app.zip",
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

> Only the directory contents will be in the zip file not the directory itself.

## Generate .htaccess

If you're using Apache server, you can generate .htaccess file by setting `htaccess` option to `true`, which is `true` by default.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/

export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        htaccess: true,
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

## Pre Render Service

SEO is very important to any website, and if you're application is SPA and using client side rendering, you can use the pre-render service to generate static html files for each route in your application when a crawler visits your website.

If your project has a pre render server that renders the pages and returns the html, you can set the pre-render service url that will be called when a crawler visits your website.

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, UserConfigExport } from "vite";
import mongezVite from "@mongez/vite";

// https://vitejs.dev/config/

export default defineConfig((): UserConfigExport => {
  return {
    plugins: [
      mongezVite({
        preRender: {
          url: "https://my-pre-render-server.com",
          crawlers:
            "Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter|bot",
        },
      }),
      react(),
    ],
  } as UserConfigExport;
});
```

Here we set the pre render service url and crawlers that will be used to detect if the request is from a crawler or not.

This feature requires .htaccess to be enabled, also it will generate a `prerender.php` file in the `dist` directory of your project, which will be call the pre-render service url and return the html to the crawler.

> For the time being, there is already an injected pre render service in the package which is `https://render.mentoor.io` that receives the url that should be rendered and returns the html, however, you can use your own pre-render service by setting the `url` option.

To disable pre render service, just set `preRender` option to `false`.
