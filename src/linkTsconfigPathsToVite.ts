import { fileExists, getJsonFile } from "@mongez/fs";
import { UserConfig } from "vite";
import { MongezViteOptions } from "./types";
import { root } from "./utils";

export default function linkTsconfigPathsToVite() {
  const aliasesList: {
    find: string;
    replacement: string;
  }[] = [];

  if (!fileExists(root("tsconfig.json"))) return;

  const tsconfig = getJsonFile(root("tsconfig.json"));

  if (!tsconfig.compilerOptions?.paths) return;

  for (const [key, value] of Object.entries(tsconfig.compilerOptions.paths)) {
    aliasesList.push({
      find: key.replace("/*", ""),
      replacement: root(String(value).replace("/*", "")),
    });
  }

  return aliasesList;
}

export function resolveTsConfigAlias(
  config: UserConfig,
  options: MongezViteOptions
) {
  if (!options.linkTsconfigPaths) return;

  if (!config.resolve?.alias && options.tsconfigAlias) {
    !config.resolve && (config.resolve = {});
    config.resolve.alias = linkTsconfigPathsToVite();
  }
}
