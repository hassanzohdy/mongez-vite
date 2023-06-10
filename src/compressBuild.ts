import { moveFile } from "@mongez/fs";
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

    const fileName =
      typeof options.compressedFileName === "function"
        ? await options.compressedFileName()
        : options.compressedFileName;

    const output = fs.createWriteStream(root(fileName));

    archive.pipe(output);

    await archive.directory(buildPath, "").finalize();
    moveFile(root(fileName), buildPath + "/" + fileName);

    console.log(
      chalk.greenBright("Build Files Have Been Compressed Successfully!")
    );
  }, 1000);
}
