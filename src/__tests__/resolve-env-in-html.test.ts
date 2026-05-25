/**
 * `transformEnvironmentVariablesInHtml` tests.
 *
 * The transform takes an HTML string and replaces every occurrence of
 * `<prefix><KEY><suffix>` with the typed env value loaded into the
 * @mongez/dotenv store. These tests load a fixture .env, drive the
 * transform directly, and confirm the substitution table matches.
 */
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadEnvFile, resetEnv } from "@mongez/dotenv";
import transformEnvironmentVariablesInHtml from "../resolve-env-in-htm";

const FIXTURES = path.join(__dirname, "fixtures");

beforeEach(() => {
  resetEnv();
  loadEnvFile(path.join(FIXTURES, ".env.html"), false);
});

afterEach(() => {
  resetEnv();
});

describe("transformEnvironmentVariablesInHtml", () => {
  it("replaces `__KEY__` tokens with env values when prefix/suffix is `__`", () => {
    const html = "<title>__APP_NAME__</title>";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    expect(out).toBe("<title>Test App</title>");
  });

  it("replaces every occurrence (global)", () => {
    const html = "<a>__APP_NAME__</a><b>__APP_NAME__</b>";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    expect(out).toBe("<a>Test App</a><b>Test App</b>");
  });

  it("supports custom prefix and suffix", () => {
    const html = "<title>{{APP_NAME}}</title>";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "\\{\\{",
      htmlEnvSuffix: "\\}\\}",
    });
    expect(out).toBe("<title>Test App</title>");
  });

  it("does NOT touch tokens for keys not in the env store", () => {
    const html = "<title>__APP_NAME__ __NOT_LOADED__</title>";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    // Loaded key replaced; unknown key left intact.
    expect(out).toContain("Test App");
    expect(out).toContain("__NOT_LOADED__");
  });

  it("coerces typed values to their string forms (numbers, booleans)", () => {
    const html = "port=__APP_PORT__ debug=__DEBUG__";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    // @mongez/dotenv coerces numbers/booleans into typed primitives. The
    // transform delegates to JavaScript's implicit toString via String
    // template substitution, so 3000 → "3000" and true → "true".
    expect(out).toBe("port=3000 debug=true");
  });

  it("returns the input unchanged when no tokens match any env key", () => {
    const html = "<title>Hard-coded</title>";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    expect(out).toBe(html);
  });

  it("substitutes interpolated `${VAR}` values resolved at load time", () => {
    // .env.html defines APP_URL=http://${APP_HOST}:${APP_PORT}. By the
    // time the html transform runs, APP_URL is already the resolved
    // string. Confirm the resolved form makes it through.
    const html = "<link href=\"__APP_URL__\" />";
    const out = transformEnvironmentVariablesInHtml(html, {
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    });
    expect(out).toBe("<link href=\"http://localhost:3000\" />");
  });
});
