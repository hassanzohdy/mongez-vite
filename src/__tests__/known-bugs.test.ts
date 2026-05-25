/**
 * Previously known-bugs documentation tests.
 *
 * These tests used to be `.skip()`'d as documentation of behaviour the
 * package got wrong. The bugs have since been fixed — each test below
 * now asserts the fix holds.
 *
 * The four originally documented bugs were:
 *   1. `src/generateHtaccess.ts:1` — `import ... from ".types"` typo.
 *   2. `src/compressBuild.ts:15` — `setTimeout` racing vite's `writeBundle`.
 *   3. `src/types.ts:94` — `preRender.url` had no default and no runtime guard.
 *   4. Legacy `envPrefix` / `envSuffix` option names in older README revisions.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import compressBuild from "../compressBuild";
import { generateHtaccess } from "../generateHtaccess";

const FIXTURES = path.join(__dirname, "fixtures", "known-bugs");

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

describe("previously known bugs (now fixed)", () => {
  /**
   * `src/generateHtaccess.ts:1`
   *
   * Original bug:
   *
   *     import { MongezViteOptions } from ".types";
   *
   * Missing slash — should be `"./types"`. Survived runtime because
   * `MongezViteOptions` is only used as a type annotation, so esbuild
   * elided the import entirely. `tsc --noEmit` against the package
   * source would fail.
   *
   * Fix: changed the import to `from "./types"`.
   */
  it("generateHtaccess.ts imports from `./types` (not `.types`)", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "..", "generateHtaccess.ts"),
      "utf-8",
    );
    expect(source).toContain('from "./types"');
    expect(source).not.toContain('from ".types"');
  });

  /**
   * `src/compressBuild.ts:15`
   *
   * Original bug:
   *
   *     setTimeout(async () => {
   *       // ... zip the build directory ...
   *     }, 1000);
   *
   * `writeBundle` is declared `sequential: true` so Vite waits for the
   * returned promise, but `compressBuild` scheduled the work inside a
   * `setTimeout` and returned immediately. Vite considered the handler
   * "done" before any zipping happened.
   *
   * Fix: dropped the `setTimeout` and now awaits the archive pipeline
   * directly. By the time `compressBuild()` resolves, `build.zip` is
   * on disk inside the build directory.
   */
  it("compressBuild() awaits the archive pipeline — build.zip exists when the promise resolves", async () => {
    const dir = fixtureDir("compress-await");
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

    // The zip ends up moved INTO the build directory by compressBuild.
    const zipPath = path.join(buildDir, "build.zip");
    expect(fs.existsSync(zipPath)).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(0);

    // Source check — guard against re-introducing the setTimeout wrapper.
    const source = fs.readFileSync(
      path.join(__dirname, "..", "compressBuild.ts"),
      "utf-8",
    );
    expect(source).not.toContain("setTimeout(");
  });

  /**
   * `src/types.ts:94`
   *
   * Original bug:
   *
   *     preRender?: { url?: string; ... } | false;
   *
   * `preRender.url` was documented as required but typed as optional
   * and had no default in `defaultOptions.ts`. If a consumer passed
   * `preRender: {}` with no `url`, the htaccess template embedded the
   * literal string `undefined` as the prerender URL.
   *
   * Fix: `generateHtaccess()` now throws a clear, descriptive error if
   * `preRender` is truthy but `preRender.url` is missing. Caught at
   * build time, even for JS consumers without TypeScript checking.
   */
  it("generateHtaccess throws a descriptive error when preRender is enabled without a url", async () => {
    const missing = fixtureDir("prerender-missing-url");
    fs.mkdirSync(path.join(missing, "dist"), { recursive: true });
    process.chdir(missing);

    await expect(
      generateHtaccess(
        { build: { outDir: "dist" } } as any,
        {
          htaccess: true,
          preRender: {} as any,
        },
      ),
    ).rejects.toThrow(/preRender\.url is required/);

    // Happy path — providing the url succeeds and the URL appears verbatim
    // (no literal "undefined" interpolated) in the generated PHP.
    const ok = fixtureDir("prerender-with-url");
    fs.mkdirSync(path.join(ok, "dist"), { recursive: true });
    process.chdir(ok);

    await generateHtaccess(
      { build: { outDir: "dist" } } as any,
      {
        htaccess: true,
        preRender: {
          url: "https://render.example.com",
          crawlers: "Googlebot",
          delay: 5000,
          cache: false,
        },
      },
    );

    const prerenderPhp = fs.readFileSync(
      path.join(ok, "dist", "prerender.php"),
      "utf-8",
    );
    expect(prerenderPhp).toContain("$prerenderUrl = 'https://render.example.com'");
  });

  /**
   * Legacy README naming.
   *
   * Older revisions of the README documented `envPrefix` and
   * `envSuffix` as the option names, but the runtime reads
   * `htmlEnvPrefix` and `htmlEnvSuffix`. A consumer following the old
   * README would have their custom prefix/suffix silently ignored.
   *
   * Fix: README + skills docs use the correct names. This test guards
   * against regression — neither doc surface should use the bare legacy
   * names as if they were live API.
   */
  it("README + skills docs use the runtime option names (`htmlEnvPrefix` / `htmlEnvSuffix`)", () => {
    const readme = fs.readFileSync(
      path.join(__dirname, "..", "..", "README.md"),
      "utf-8",
    );
    const skill = fs.readFileSync(
      path.join(__dirname, "..", "..", "skills", "env-in-html.md"),
      "utf-8",
    );

    // Correct names are present in both doc surfaces.
    expect(readme).toContain("htmlEnvPrefix");
    expect(readme).toContain("htmlEnvSuffix");
    expect(skill).toContain("htmlEnvPrefix");
    expect(skill).toContain("htmlEnvSuffix");

    // skills/env-in-html.md should NOT mention the legacy names at all.
    expect(skill).not.toMatch(/\benvPrefix\b/);
    expect(skill).not.toMatch(/\benvSuffix\b/);
  });
});
