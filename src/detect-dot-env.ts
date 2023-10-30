import { loadEnv } from "@mongez/dotenv";
import fs from "fs";
import { ConfigEnv } from "vite";
import { MongezViteOptions } from "./types";
import { root } from "./utils";

function detectEnvironmentVariablesAndLoadIt(command: ConfigEnv["command"]) {
  const envPaths = {
    build: [root(".env.production"), root(".env.build")],
    serve: [root(".env.development"), root(".env.local")],
  };

  let envPath = root(".env");
  if (command === "build") {
    for (const path of envPaths.build) {
      if (fs.existsSync(path)) {
        envPath = path;
        break;
      }
    }
  } else if (command === "serve") {
    for (const path of envPaths.serve) {
      if (fs.existsSync(path)) {
        envPath = path;
        break;
      }
    }
  }

  if (!fs.existsSync(envPath)) return;

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
    if (!fs.existsSync(root(".env." + options.productionEnvName))) return;

    loadEnv(root(".env." + options.productionEnvName), {
      override: true,
      loadSharedEnv: true,
    });
  } else {
    detectEnvironmentVariablesAndLoadIt(command);
  }
}
