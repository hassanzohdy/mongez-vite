/**
 * Default-options tests.
 *
 * Asserts the documented defaults match what the package ships. Important
 * because consumers rely on the package "doing the right thing" without
 * passing any options.
 */
import { describe, expect, it } from "vitest";
import { defaultOptions } from "../default-options";

describe("defaultOptions", () => {
  it("uses the documented PUBLIC_URL env key", () => {
    expect(defaultOptions.envBaseUrlKey).toBe("PUBLIC_URL");
  });

  it("uses double-underscore html env affixes by default", () => {
    expect(defaultOptions.htmlEnvPrefix).toBe("__");
    expect(defaultOptions.htmlEnvSuffix).toBe("__");
  });

  it("opens the browser by default in dev", () => {
    expect(defaultOptions.autoOpenBrowser).toBe(true);
  });

  it("links tsconfig paths by default", () => {
    expect(defaultOptions.linkTsconfigPaths).toBe(true);
    expect(defaultOptions.tsconfigAlias).toBe(true);
  });

  it("names the compressed bundle `build.zip` by default", () => {
    expect(defaultOptions.compressedFileName).toBe("build.zip");
    expect(defaultOptions.compressBuild).toBe(true);
  });

  it("does NOT emit .htaccess by default (opt-in)", () => {
    // The README says htaccess is `true` by default, but the actual default
    // in code is `false`. Consumers must opt in.
    expect(defaultOptions.htaccess).toBe(false);
  });

  it("does NOT inject a prerender pipeline by default", () => {
    expect(defaultOptions.preRender).toBe(false);
  });

  it("seeds optimizeDeps with index.html + per-app provider entries", () => {
    expect(defaultOptions.optimizeDeps).toBeTypeOf("object");
    const entries = (defaultOptions.optimizeDeps as any).entries as string[];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBe(2);
    expect(entries[0].endsWith("/index.html")).toBe(true);
    expect(entries[1].endsWith("/src/apps/**/provider.ts")).toBe(true);
  });
});
