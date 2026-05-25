/**
 * `resolveEnvironmentVariables` tests.
 *
 * The helper consults `process.cwd()` (via the local `root()` helper) for
 * `.env.<environment>` files. We create temp fixture directories with
 * known contents, chdir into them, and confirm the right file is loaded
 * for each (command, productionEnvName) combination.
 *
 * Resolution order (no `productionEnvName`):
 *   - `build` → .env.production → .env.build → .env
 *   - `serve` → .env.development → .env.local → .env
 *
 * With `productionEnvName: "stage"` and `command: "build"`:
 *   - → .env.stage only (returns early if missing — does not fall back).
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { env, resetEnv } from "@mongez/dotenv";
import resolveEnvironmentVariables from "../detect-dot-env";

// Helper: strip a key out of @mongez/dotenv's internal store so a missing
// load leaves it unset. `resetEnv` re-seeds from the import-time snapshot
// of process.env, so vitest-injected keys like `MODE=test` survive a reset
// and falsely satisfy `env("MODE")`. We blow them away explicitly.
function clearStoreKey(key: string) {
  const all = env.all() as Record<string, unknown>;
  delete all[key];
}

const FIXTURES_ROOT = path.join(__dirname, "fixtures", "env-detection");

let originalCwd: string;

function fixtureDir(name: string): string {
  const dir = path.join(FIXTURES_ROOT, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeEnvFile(dir: string, filename: string, body: string): void {
  fs.writeFileSync(path.join(dir, filename), body, "utf-8");
}

beforeEach(() => {
  originalCwd = process.cwd();
  resetEnv();
  // resetEnv() re-seeds from process.env's import-time snapshot, so
  // vitest-injected keys (MODE=test) survive a reset. Strip the key we
  // care about so a missing .env file genuinely leaves it unset.
  clearStoreKey("MODE");
});

afterEach(() => {
  process.chdir(originalCwd);
  resetEnv();
});

describe("resolveEnvironmentVariables — build mode", () => {
  it("prefers `.env.production` over `.env.build` over `.env`", () => {
    const dir = fixtureDir("build-prefers-production");
    writeEnvFile(dir, ".env.production", "MODE=production\n");
    writeEnvFile(dir, ".env.build", "MODE=build\n");
    writeEnvFile(dir, ".env", "MODE=fallback\n");
    process.chdir(dir);

    resolveEnvironmentVariables("build", {});
    expect(env("MODE")).toBe("production");
  });

  it("falls back to `.env.build` when `.env.production` is missing", () => {
    const dir = fixtureDir("build-falls-to-build");
    writeEnvFile(dir, ".env.build", "MODE=build\n");
    writeEnvFile(dir, ".env", "MODE=fallback\n");
    process.chdir(dir);

    resolveEnvironmentVariables("build", {});
    expect(env("MODE")).toBe("build");
  });

  it("falls back to `.env` when neither production nor build exists", () => {
    const dir = fixtureDir("build-falls-to-env");
    writeEnvFile(dir, ".env", "MODE=plain-fallback\n");
    process.chdir(dir);

    resolveEnvironmentVariables("build", {});
    expect(env("MODE")).toBe("plain-fallback");
  });

  it("no-ops when no .env file exists at all", () => {
    const dir = fixtureDir("build-no-env");
    process.chdir(dir);

    expect(() => resolveEnvironmentVariables("build", {})).not.toThrow();
    expect(env("MODE")).toBeUndefined();
  });
});

describe("resolveEnvironmentVariables — serve mode", () => {
  it("prefers `.env.development` over `.env.local` over `.env`", () => {
    const dir = fixtureDir("serve-prefers-development");
    writeEnvFile(dir, ".env.development", "MODE=development\n");
    writeEnvFile(dir, ".env.local", "MODE=local\n");
    writeEnvFile(dir, ".env", "MODE=fallback\n");
    process.chdir(dir);

    resolveEnvironmentVariables("serve", {});
    expect(env("MODE")).toBe("development");
  });

  it("falls back to `.env.local` when development is missing", () => {
    const dir = fixtureDir("serve-falls-to-local");
    writeEnvFile(dir, ".env.local", "MODE=local-fallback\n");
    process.chdir(dir);

    resolveEnvironmentVariables("serve", {});
    expect(env("MODE")).toBe("local-fallback");
  });
});

describe("resolveEnvironmentVariables — productionEnvName override", () => {
  it("loads only `.env.<name>` during build when set", () => {
    const dir = fixtureDir("custom-prod-name");
    writeEnvFile(dir, ".env.stage", "MODE=stage\n");
    writeEnvFile(dir, ".env.production", "MODE=prod-should-not-load\n");
    process.chdir(dir);

    resolveEnvironmentVariables("build", { productionEnvName: "stage" });
    expect(env("MODE")).toBe("stage");
  });

  it("returns early without falling back when the named file is missing", () => {
    const dir = fixtureDir("custom-prod-name-missing");
    writeEnvFile(dir, ".env.production", "MODE=prod\n");
    process.chdir(dir);

    // `productionEnvName: "stage"` set but no `.env.stage` exists. The
    // helper returns early — it does NOT fall back to `.env.production`.
    resolveEnvironmentVariables("build", { productionEnvName: "stage" });
    expect(env("MODE")).toBeUndefined();
  });

  it("ignores `productionEnvName` during serve mode (falls through to detect path)", () => {
    const dir = fixtureDir("custom-prod-name-serve");
    writeEnvFile(dir, ".env.development", "MODE=dev\n");
    process.chdir(dir);

    resolveEnvironmentVariables("serve", { productionEnvName: "stage" });
    expect(env("MODE")).toBe("dev");
  });
});
