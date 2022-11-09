import { ConfigEnv, UserConfig } from "vite";
import { MongezViteOptions } from "./types";

export default function resolveAutoOpenBrowser(
  config: UserConfig,
  command: ConfigEnv["command"],
  options: MongezViteOptions,
) {
  if (
    command === "serve" &&
    ![false, true].includes(config.server?.open as boolean) &&
    options.autoOpenBrowser
  ) {
    !config.server && (config.server = {});
    config.server.open = true;
  }
}
