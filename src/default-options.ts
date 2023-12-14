import { cwd } from "process";
import { MongezViteOptions } from "./types";

// const preRender = {
//   crawlers: `Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter`,
//   url: "https://render.mentoor.io",
//   delay: 5000,
//   cache: false,
// };

export const defaultOptions: MongezViteOptions = {
  envBaseUrlKey: "PUBLIC_URL",
  htmlEnvPrefix: "__",
  htmlEnvSuffix: "__",
  autoOpenBrowser: true,
  tsconfigAlias: true,
  linkTsconfigPaths: true,
  compressedFileName: "build.zip",
  compressBuild: true,
  htaccess: false,
  preRender: false,
  optimizeDeps: {
    entries: [cwd() + "/index.html", cwd() + "/src/apps/**/provider.ts"],
  },
};
