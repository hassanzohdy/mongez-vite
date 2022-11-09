import { move } from "@mongez/fs";
import archiver from "archiver";
import chalk from "chalk";
import fs from "fs";
import { UserConfig } from "vite";
import { MongezViteOptions } from "./types";
import { root } from "./utils";

export default async function compressBuild(
  config: UserConfig,
  options: MongezViteOptions
) {
  if (!options.compressBuild) return;

  setTimeout(async () => {
    const outDir = config.build?.outDir || "dist";

    console.log(chalk.yellowBright("Compressing build directory..."));

    // import path package
    const buildPath = root(outDir);

    const archive = archiver.create("zip", {
      zlib: 9,
    });

    const output = fs.createWriteStream(root(options.compressFileName));

    archive.pipe(output);

    await archive.directory(buildPath, "").finalize();
    move(root(options.compressFileName), buildPath + "/build.zip");

    console.log(
      chalk.greenBright("Build Files Have Been Compressed Successfully!")
    );
  }, 1000);
}
