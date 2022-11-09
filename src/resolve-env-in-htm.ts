import { env } from "@mongez/dotenv";
import { MongezViteOptions } from "./types";

export default function transformEnvironmentVariablesInHtml(
  html: string,
  options: MongezViteOptions,
) {
  const envVariables = env.all();

  // now loop over all env variables and replace them in the html
  // but add also the prefix and suffix
  for (const key in envVariables) {
    const value = envVariables[key];
    html = html.replace(
      new RegExp(`${options.htmlEnvPrefix}${key}${options.htmlEnvSuffix}`, "g"),
      value,
    );
  }

  return html;
}
