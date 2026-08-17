import { moveFile } from "@mongez/fs";
import archiver from "archiver";
import { colors } from "@mongez/copper";
import fs from "fs";
import path from "path";
import { UserConfig } from "vite";
import { MongezViteOptions } from "./types";
import { root } from "./utils";

export default async function compressBuild(
  config: UserConfig,
  options: MongezViteOptions
) {
  if (!options.compressBuild) return;

  const outDir = config.build?.outDir || "dist";

  console.log(colors.yellowBright("Compressing build directory..."));

  // import path package
  const buildPath = root(outDir);

  const archive = archiver.create("zip", {
    zlib: 9,
  });

  const rawFileName =
    typeof options.compressedFileName === "function"
      ? await options.compressedFileName()
      : options.compressedFileName;

  // Strip any directory component so a hostile/derived file name (e.g.
  // `../../evil.zip`) can't write or move the zip outside `buildPath`.
  const fileName = path.basename(rawFileName as string);

  const output = fs.createWriteStream(root(fileName));

  archive.pipe(output);

  await archive.directory(buildPath, "").finalize();
  moveFile(root(fileName), path.join(buildPath, fileName));

  console.log(
    colors.greenBright("Build Files Have Been Compressed Successfully!")
  );
}
