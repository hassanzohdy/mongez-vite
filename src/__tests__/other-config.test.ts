/**
 * `resolveOtherConfig` tests.
 *
 * The helper has two responsibilities:
 *   1. Set `config.base` from `env(envBaseUrlKey)` during `vite build`,
 *      unless the user already specified a base.
 *   2. Install `optimizeDeps` from the plugin options when the user
 *      hasn't already set `config.optimizeDeps`.
 *
 * Driven via the @mongez/dotenv store, so each test resets and re-loads
 * fixtures as needed.
 */
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadEnvFile, resetEnv } from "@mongez/dotenv";
import resolveOtherConfig from "../other-config";

const FIXTURES = path.join(__dirname, "fixtures");

beforeEach(() => {
  resetEnv();
});

afterEach(() => {
  resetEnv();
});

describe("resolveOtherConfig — baseUrl", () => {
  it("sets `config.base` from env(envBaseUrlKey) during build", () => {
    loadEnvFile(path.join(FIXTURES, ".env.public-url"), false);
    const config: any = {};
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.base).toBe("https://cdn.example.com/");
  });

  it("appends a trailing slash if missing", () => {
    loadEnvFile(path.join(FIXTURES, ".env.public-url-no-slash"), false);
    const config: any = {};
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    // Source uses rtrim + manual "/" so a missing trailing slash is added.
    expect(config.base).toBe("https://cdn.example.com/");
  });

  it("strips multiple trailing slashes down to one", () => {
    loadEnvFile(path.join(FIXTURES, ".env.public-url-multi-slash"), false);
    const config: any = {};
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.base).toBe("https://cdn.example.com/");
  });

  it("does NOTHING during `serve` (dev mode keeps its own base)", () => {
    loadEnvFile(path.join(FIXTURES, ".env.public-url"), false);
    const config: any = {};
    resolveOtherConfig(config, "serve", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.base).toBeUndefined();
  });

  it("does NOT overwrite a pre-existing `config.base` during build", () => {
    loadEnvFile(path.join(FIXTURES, ".env.public-url"), false);
    const config: any = { base: "/already-set/" };
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.base).toBe("/already-set/");
  });

  it("falls back to `/` when env variable is unset (rtrim of undefined)", () => {
    // No env loaded — env("PUBLIC_URL") returns undefined → rtrim(undefined, "/")
    // returns "" → + "/" → "/". Slightly surprising but documented behavior.
    const config: any = {};
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.base).toBe("/");
  });
});

describe("resolveOtherConfig — optimizeDeps", () => {
  it("installs `optimizeDeps` from options when user hasn't set it", () => {
    const config: any = {};
    const optimizeDeps = { entries: ["index.html"] };
    resolveOtherConfig(config, "build", {
      envBaseUrlKey: "PUBLIC_URL",
      optimizeDeps,
    });
    expect(config.optimizeDeps).toBe(optimizeDeps);
  });

  it("does NOT overwrite a user-supplied `optimizeDeps`", () => {
    const userOptimizeDeps = { entries: ["custom.html"], force: true };
    const config: any = { optimizeDeps: userOptimizeDeps };
    resolveOtherConfig(config, "build", {
      envBaseUrlKey: "PUBLIC_URL",
      optimizeDeps: { entries: ["should-not-win.html"] },
    });
    expect(config.optimizeDeps).toBe(userOptimizeDeps);
  });

  it("leaves `optimizeDeps` undefined when neither user nor options provide it", () => {
    const config: any = {};
    resolveOtherConfig(config, "build", { envBaseUrlKey: "PUBLIC_URL" });
    expect(config.optimizeDeps).toBeUndefined();
  });
});
