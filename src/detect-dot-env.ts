import { loadEnv } from "@mongez/dotenv";
import fs from "fs";
import { ConfigEnv } from "vite";
import { MongezViteOptions } from "./types";
import { root } from "./utils";

function detectEnvironmentVariablesAndLoadIt(command: ConfigEnv["command"]) {
  let envPath = root(".env");
  if (command === "build") {
    envPath = root(`.env.production`);
    if (!fs.existsSync(envPath)) {
      envPath = root(`.env.build`);

      if (!fs.existsSync(envPath)) {
        envPath = root(`.env`);
      }
    }
  } else if (command === "serve") {
    envPath = root(`.env.development`);
    if (!fs.existsSync(envPath)) {
      envPath = root(`.env.serve`);
      if (!fs.existsSync(envPath)) {
        envPath = root(`.env`);
      }
    }
  }

  loadEnv(envPath, {
    override: true,
    loadSharedEnv: true,
  });
}

export default function resolveEnvironmentVariables(
  command: ConfigEnv["command"],
  options: MongezViteOptions
) {
  if (options.productionEnvName && command === "build") {
    loadEnv(root(".env." + options.productionEnvName), {
      override: true,
      loadSharedEnv: true,
    });
  } else {
    detectEnvironmentVariablesAndLoadIt(command);
  }
}
