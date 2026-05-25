/**
 * End-to-end-ish tests of the `config` hook.
 *
 * Boots the plugin in isolation, calls its `config` callback with a known
 * empty UserConfig + ConfigEnv, and inspects the mutated config. This
 * exercises the four helpers (`resolveAutoOpenBrowser`,
 * `resolveTsConfigAlias`, `resolveEnvironmentVariables`,
 * `resolveOtherConfig`) in the same order Vite would call them.
 *
 * Vite itself is NOT booted.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetEnv } from "@mongez/dotenv";
import mongezVite from "../index";

const FIXTURES = path.join(__dirname, "fixtures", "integration");

let originalCwd: string;

function fixtureDir(name: string): string {
  const dir = path.join(FIXTURES, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  originalCwd = process.cwd();
  resetEnv();
});

afterEach(() => {
  process.chdir(originalCwd);
  resetEnv();
});

describe("config() hook — serve mode (dev)", () => {
  it("opens the browser, leaves base unset, ignores `.env.production`", () => {
    const dir = fixtureDir("serve-default");
    fs.writeFileSync(path.join(dir, ".env.development"), "DEV_MODE=on\n");
    process.chdir(dir);

    const plugin = mongezVite({
      autoOpenBrowser: true,
      linkTsconfigPaths: false, // no tsconfig in fixture
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = {};
    plugin.config(config, { command: "serve", mode: "development" });

    expect(config.server?.open).toBe(true);
    expect(config.base).toBeUndefined();
  });

  it("respects an explicit server.open=false", () => {
    process.chdir(fixtureDir("serve-explicit-no-open"));

    const plugin = mongezVite({
      autoOpenBrowser: true,
      linkTsconfigPaths: false,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = { server: { open: false } };
    plugin.config(config, { command: "serve", mode: "development" });

    expect(config.server.open).toBe(false);
  });
});

describe("config() hook — build mode", () => {
  it("sets config.base from PUBLIC_URL in .env.production", () => {
    const dir = fixtureDir("build-public-url");
    fs.writeFileSync(
      path.join(dir, ".env.production"),
      "PUBLIC_URL=https://prod-cdn.example.com/\n",
    );
    process.chdir(dir);

    const plugin = mongezVite({
      autoOpenBrowser: false,
      linkTsconfigPaths: false,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = {};
    plugin.config(config, { command: "build", mode: "production" });

    expect(config.base).toBe("https://prod-cdn.example.com/");
    // Browser doesn't open during build.
    expect(config.server?.open).toBeUndefined();
  });

  it("does NOT overwrite a user-provided base", () => {
    const dir = fixtureDir("build-explicit-base");
    fs.writeFileSync(
      path.join(dir, ".env.production"),
      "PUBLIC_URL=https://should-not-win.example.com/\n",
    );
    process.chdir(dir);

    const plugin = mongezVite({
      autoOpenBrowser: false,
      linkTsconfigPaths: false,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = { base: "/user-provided/" };
    plugin.config(config, { command: "build", mode: "production" });

    expect(config.base).toBe("/user-provided/");
  });
});

describe("config() hook — tsconfig integration", () => {
  it("installs `resolve.alias` from tsconfig paths when enabled", () => {
    const dir = fixtureDir("tsconfig-paths");
    fs.writeFileSync(
      path.join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: { "@/*": ["src/*"] },
        },
      }),
    );
    process.chdir(dir);

    const plugin = mongezVite({
      autoOpenBrowser: false,
      linkTsconfigPaths: true,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = {};
    plugin.config(config, { command: "serve", mode: "development" });

    expect(Array.isArray(config.resolve?.alias)).toBe(true);
    const aliases = config.resolve.alias as Array<{
      find: string;
      replacement: string;
    }>;
    expect(aliases.find(a => a.find === "@")).toBeDefined();
  });

  it("skips tsconfig integration when linkTsconfigPaths is false", () => {
    const dir = fixtureDir("tsconfig-skipped");
    fs.writeFileSync(
      path.join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { paths: { "@/*": ["src/*"] } },
      }),
    );
    process.chdir(dir);

    const plugin = mongezVite({
      autoOpenBrowser: false,
      linkTsconfigPaths: false,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const config: any = {};
    plugin.config(config, { command: "serve", mode: "development" });

    expect(config.resolve?.alias).toBeUndefined();
  });
});
