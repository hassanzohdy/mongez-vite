import { MongezViteOptions } from "./types";
import { getFile, putFile } from "@mongez/fs";
import { colors } from "@mongez/copper";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { UserConfig } from "vite";
import generatePreRenderContent from "./prerender";

// this is needed because of esm module does not support __dirname
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));

const DEFAULT_CRAWLERS =
  "Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter|bot";

// Strip newlines/carriage-returns (and other control chars) so a hostile
// `crawlers` value can't inject extra lines/directives into the .htaccess
// file. `crawlers` is otherwise an intentional raw regex fragment, so we
// don't escape regex metacharacters here.
const sanitizeCrawlers = (crawlers: string) =>
  crawlers.replace(/[\x00-\x1f\x7f]/g, "");

const preprenderContent = (crawlers?: string) => `# Prerender
RewriteCond %{HTTP_USER_AGENT} .*(${sanitizeCrawlers(crawlers || DEFAULT_CRAWLERS)}).* [NC]
RewriteCond %{REQUEST_URI} !^(/public)
RewriteRule (.*) prerender.php [L,QSA]
`;

export async function generateHtaccess(
  config: UserConfig,
  options: MongezViteOptions
) {
  if (!options.htaccess) return;

  console.log(colors.yellowBright("Generating htaccess file..."));

  const outDir = config.build?.outDir || "dist";

  // generate htaccess file in the build directory
  let htaccessFile = getFile(_dirname + "/.htaccess");

  if (options.preRender) {
    if (!options.preRender.url) {
      throw new Error(
        "[@mongez/vite] preRender.url is required when preRender is enabled. " +
          "Pass `preRender: { url: \"https://your-prerender-service.example.com\" }` " +
          "or set `preRender: false` to disable prerendering."
      );
    }

    htaccessFile = htaccessFile.replace(
      "# Prerender",
      preprenderContent(options.preRender.crawlers)
    );

    const preRenderContent = generatePreRenderContent({
      delay: options.preRender.delay,
      cache: options.preRender.cache,
      prerenderUrl: options.preRender.url,
    });

    putFile(outDir + "/prerender.php", preRenderContent);
  } else {
    htaccessFile = htaccessFile.replace("# Prerender", "");
  }

  putFile(outDir + "/.htaccess", htaccessFile);

  console.log(
    colors.greenBright("Htaccess file has been generated successfully!")
  );
}
