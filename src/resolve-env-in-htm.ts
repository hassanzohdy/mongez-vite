import { env } from "@mongez/dotenv";
import { MongezViteOptions } from "./types";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function transformEnvironmentVariablesInHtml(
  html: string,
  options: MongezViteOptions,
) {
  const envVariables = env.all();

  // now loop over all env variables and replace them in the html
  // but add also the prefix and suffix
  //
  // Note: htmlEnvPrefix/htmlEnvSuffix are documented and tested as raw
  // regex fragments (consumers pass values like `\{\{`/`\}\}`), so they're
  // deliberately not regex-escaped here.
  for (const key in envVariables) {
    const value = escapeHtml(String(envVariables[key]));
    html = html.replace(
      new RegExp(`${options.htmlEnvPrefix}${key}${options.htmlEnvSuffix}`, "g"),
      // Use a replacement function (not a string) so values containing
      // `$&`, `$1`, `$$`, etc. are substituted literally instead of being
      // interpreted as String.replace special patterns.
      () => value,
    );
  }

  return html;
}
