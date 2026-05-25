/**
 * `linkTsconfigPathsToVite` + `resolveTsConfigAlias` tests.
 *
 * The default-export reads `tsconfig.json` from `process.cwd()` and produces
 * a `resolve.alias`-shaped list. `resolveTsConfigAlias` mutates the Vite
 * config to install the alias list when the user hasn't already provided
 * their own.
 *
 * We chdir to a fixture directory containing a `tsconfig.json` with `paths`
 * and confirm the produced aliases match.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import linkTsconfigPathsToVite, {
  resolveTsConfigAlias,
} from "../linkTsconfigPathsToVite";

const FIXTURES = path.join(__dirname, "fixtures");
const TSCONFIG_FIXTURE = path.join(FIXTURES, "tsconfig-fixture");

let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  // Create a fixture project on the fly so the test is self-contained.
  if (!fs.existsSync(TSCONFIG_FIXTURE)) {
    fs.mkdirSync(TSCONFIG_FIXTURE, { recursive: true });
  }
  fs.writeFileSync(
    path.join(TSCONFIG_FIXTURE, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
          "components/*": ["src/components/*"],
          "lib": ["src/lib/index.ts"],
        },
      },
    }),
  );
  process.chdir(TSCONFIG_FIXTURE);
});

afterEach(() => {
  process.chdir(originalCwd);
});

describe("linkTsconfigPathsToVite", () => {
  it("returns an alias list shaped for vite's `resolve.alias`", () => {
    const aliases = linkTsconfigPathsToVite();
    expect(Array.isArray(aliases)).toBe(true);
    expect(aliases).toHaveLength(3);
    // Each entry has `find` + `replacement` (vite's array-of-objects form).
    for (const a of aliases as any[]) {
      expect(a).toHaveProperty("find");
      expect(a).toHaveProperty("replacement");
    }
  });

  it("strips the trailing `/*` glob from both find and replacement", () => {
    const aliases = linkTsconfigPathsToVite() as Array<{
      find: string;
      replacement: string;
    }>;
    const at = aliases.find(a => a.find === "@");
    expect(at).toBeDefined();
    // `@/*` → find: `@`, replacement: `<cwd>/src` (no trailing `/*`).
    expect(at!.find).toBe("@");
    const normalized = at!.replacement.replace(/\\/g, "/");
    expect(normalized.endsWith("src")).toBe(true);
    expect(normalized.endsWith("/*")).toBe(false);
  });

  it("preserves entries without a `/*` suffix verbatim", () => {
    const aliases = linkTsconfigPathsToVite() as Array<{
      find: string;
      replacement: string;
    }>;
    const lib = aliases.find(a => a.find === "lib");
    expect(lib).toBeDefined();
    // path.resolve normalises separators per platform; compare the tail
    // in a separator-agnostic way.
    const normalized = lib!.replacement.replace(/\\/g, "/");
    expect(normalized.endsWith("src/lib/index.ts")).toBe(true);
  });

  it("returns undefined when there is no tsconfig.json in cwd", () => {
    process.chdir(originalCwd); // no tsconfig in @mongez/vite root
    const aliases = linkTsconfigPathsToVite();
    expect(aliases).toBeUndefined();
  });

  it("returns undefined when tsconfig has no `paths`", () => {
    fs.writeFileSync(
      path.join(TSCONFIG_FIXTURE, "tsconfig.json"),
      JSON.stringify({ compilerOptions: {} }),
    );
    const aliases = linkTsconfigPathsToVite();
    expect(aliases).toBeUndefined();
  });
});

describe("resolveTsConfigAlias", () => {
  it("installs the alias list on the vite config", () => {
    const config: any = {};
    resolveTsConfigAlias(config, {
      linkTsconfigPaths: true,
      tsconfigAlias: true,
    });
    expect(Array.isArray(config.resolve?.alias)).toBe(true);
    expect((config.resolve.alias as any[]).length).toBe(3);
  });

  it("is a no-op when `linkTsconfigPaths` is false", () => {
    const config: any = {};
    resolveTsConfigAlias(config, {
      linkTsconfigPaths: false,
      tsconfigAlias: true,
    });
    expect(config.resolve).toBeUndefined();
  });

  it("does NOT overwrite a pre-existing `resolve.alias`", () => {
    const userAliases = [{ find: "user-defined", replacement: "/elsewhere" }];
    const config: any = { resolve: { alias: userAliases } };
    resolveTsConfigAlias(config, {
      linkTsconfigPaths: true,
      tsconfigAlias: true,
    });
    expect(config.resolve.alias).toBe(userAliases);
  });
});
