import { MongezViteOptions } from ".types";
import { getFile, putFile } from "@mongez/fs";
import { colors } from "@mongez/copper";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { UserConfig } from "vite";
import generatePreRenderContent from "./prerender";

// this is needed because of esm module does not support __dirname
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));

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

  console.log(colors.yellowBright("Generating htaccess file..."));

  const outDir = config.build?.outDir || "dist";

  // generate htaccess file in the build directory
  let htaccessFile = getFile(_dirname + "/.htaccess");

  if (options.preRender) {
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
