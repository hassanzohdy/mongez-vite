import { MongezViteOptions } from ".types";
import { getFile, putFile } from "@mongez/fs";
import chalk from "chalk";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { UserConfig } from "vite";

// this is needed because of esm module does not support __dirname
if (typeof __dirname === "undefined") {
  globalThis.__dirname = dirname(fileURLToPath(import.meta.url));
}

const preprenderContent = (crawlers: string) => `# Prerender
RewriteCond %{HTTP_USER_AGENT} .*(${crawlers}).* [NC]
RewriteCond %{REQUEST_URI} !^(/public)
RewriteRule (.*) prerender.php [L,QSA]
`;

export async function generateHtaccess(
  config: UserConfig,
  options: MongezViteOptions
) {
  if (!options.htaccess) return;

  console.log(chalk.yellowBright("Generating htaccess file..."));

  const outDir = config.build?.outDir || "dist";

  // generate htaccess file in the build directory
  let htaccessFile = getFile(__dirname + "/.htaccess");

  if (options.preRender) {
    htaccessFile = htaccessFile.replace(
      "# Prerender",
      preprenderContent(options.preRender.crawlers)
    );

    let preRenderFile = getFile(__dirname + "/prerender.php");

    preRenderFile = preRenderFile.replace(
      "__PRENDER_URL__",
      options.preRender.url
    );
    preRenderFile = preRenderFile.replace("__DELAY__", options.preRender.delay);
    preRenderFile = preRenderFile.replace(
      "__REFRESH__",
      options.preRender.refresh
    );

    putFile(outDir + "/prerender.php", preRenderFile);
  } else {
    htaccessFile = htaccessFile.replace("# Prerender", "");
  }

  putFile(outDir + "/.htaccess", htaccessFile);

  console.log(
    chalk.greenBright("Htaccess file has been generated successfully!")
  );
}
