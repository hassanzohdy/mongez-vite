import { PluginOption, UserConfig } from "vite";
import compressBuild from "./compressBuild";
import { defaultOptions } from "./default-options";
import resolveEnvironmentVariables from "./detect-dot-env";
import { generateHtaccess } from "./generateHtaccess";
import { resolveTsConfigAlias } from "./linkTsconfigPathsToVite";
import resolveOtherConfig from "./other-config";
import transformEnvironmentVariablesInHtml from "./resolve-env-in-htm";
import resolveAutoOpenBrowser from "./resolveAutoOpenBrowser";
import { MongezViteOptions } from "./types";

let currentConfig: UserConfig;

export default function mongezVite(
  pluginOptions: MongezViteOptions = {}
): PluginOption {
  const options = { ...defaultOptions, ...pluginOptions };
  return {
    name: "mongez-vite",
    writeBundle: {
      sequential: true,
      handler: async () => {
        await generateHtaccess(currentConfig, options);
        await compressBuild(currentConfig, options);
      },
    },
    config: (config, { command }) => {
      currentConfig = config;
      resolveAutoOpenBrowser(config, command, options);
      resolveTsConfigAlias(config, options);
      resolveEnvironmentVariables(command, options);
      resolveOtherConfig(config, command, options);

      return config;
    },
    transformIndexHtml: (html) => {
      return transformEnvironmentVariablesInHtml(html, options);
    },
  };
}
