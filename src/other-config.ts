import { env } from "@mongez/dotenv";
import { rtrim } from "@mongez/reinforcements";
import chalk from "chalk";
import { ConfigEnv, UserConfig } from "vite";
import { MongezViteOptions } from "./types";

export default function resolveOtherConfig(
  config: UserConfig,
  command: ConfigEnv["command"],
  options: MongezViteOptions
) {
  if (command === "build" && !config.base) {
    let baseUrl = "";

    baseUrl = rtrim(env(options.envBaseUrlKey), "/") + "/";
    console.log("Creating A Build For Production:", chalk.green(baseUrl));

    config.base = baseUrl;
  }
}
