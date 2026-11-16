/**
 * `compressBuild` security regression test.
 *
 * `options.compressedFileName` (a string or the return value of a
 * user-supplied function) was previously used unsanitized to build the
 * output/move paths, so a value containing `../` segments could write or
 * move the zip outside the intended build directory.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import compressBuild from "../compressBuild";

const FIXTURES = path.join(__dirname, "fixtures", "compress-build");

let originalCwd: string;

function fixtureDir(name: string): string {
  const dir = path.join(FIXTURES, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  originalCwd = process.cwd();
});

afterEach(() => {
  process.chdir(originalCwd);
});

describe("compressBuild() compressedFileName path traversal", () => {
  it("strips `../` segments so the zip can't escape buildPath", async () => {
    const dir = fixtureDir("traversal-string");
    const buildDir = path.join(dir, "dist");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, "index.html"), "<html></html>");

    process.chdir(dir);

    await compressBuild(
      { build: { outDir: "dist" } } as any,
      {
        compressBuild: true,
        compressedFileName: "../../evil.zip",
      },
    );

    // Nothing was written outside the project directory.
    expect(fs.existsSync(path.join(dir, "..", "..", "evil.zip"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "..", "evil.zip"))).toBe(false);

    // The zip ends up inside the build directory, using only the basename.
    const zipPath = path.join(buildDir, "evil.zip");
    expect(fs.existsSync(zipPath)).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(0);
  });

  it("strips `../` segments when compressedFileName is a function", async () => {
    const dir = fixtureDir("traversal-function");
    const buildDir = path.join(dir, "dist");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, "index.html"), "<html></html>");

    process.chdir(dir);

    await compressBuild(
      { build: { outDir: "dist" } } as any,
      {
        compressBuild: true,
        compressedFileName: () => "../../../evil.zip",
      },
    );

    expect(fs.existsSync(path.join(dir, "..", "..", "..", "evil.zip"))).toBe(
      false,
    );

    const zipPath = path.join(buildDir, "evil.zip");
    expect(fs.existsSync(zipPath)).toBe(true);
  });

  it("still compresses to a normal file name inside buildPath", async () => {
    const dir = fixtureDir("normal-name");
    const buildDir = path.join(dir, "dist");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, "index.html"), "<html></html>");

    process.chdir(dir);

    await compressBuild(
      { build: { outDir: "dist" } } as any,
      {
        compressBuild: true,
        compressedFileName: "build.zip",
      },
    );

    const zipPath = path.join(buildDir, "build.zip");
    expect(fs.existsSync(zipPath)).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(0);
  });
});

describe("compressBuild() symlinks", () => {
  it("leaves symlink entries out of the zip", async () => {
    // A temp dir, so the run never leaves a machine-specific symlink in the tree.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mongez-vite-symlink-"));
    const buildDir = path.join(dir, "dist");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, "index.html"), "<html></html>");
    const secret = path.join(dir, "secret.txt");
    fs.writeFileSync(secret, "outside the build");
    fs.symlinkSync(secret, path.join(buildDir, "link.txt"));

    process.chdir(dir);

    try {
      await compressBuild(
        { build: { outDir: "dist" } } as any,
        { compressBuild: true, compressedFileName: "build.zip" },
      );

      const zip = fs.readFileSync(path.join(buildDir, "build.zip")).toString("latin1");
      expect(zip).toContain("index.html");
      expect(zip).not.toContain("link.txt");
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
