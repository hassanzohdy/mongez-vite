/**
 * Plugin factory tests.
 *
 * Verifies the shape of the object returned by `mongezVite()`:
 *   - `name` matches the documented value.
 *   - `config`, `transformIndexHtml`, and `writeBundle` hooks are wired.
 *   - The `writeBundle` hook is declared as `sequential: true` so
 *     post-build steps run after Vite finishes emitting assets.
 *   - Calling the factory with no options merges defaults and produces
 *     the same hook shape.
 *
 * Vite itself is NOT booted — these are pure shape assertions. An end-to-end
 * dev-server or build test is out of scope for unit testing.
 */
import { describe, expect, it } from "vitest";
import mongezVite from "../index";

describe("mongezVite() — plugin factory", () => {
  it("returns a plugin object with the documented name", () => {
    const plugin = mongezVite() as any;
    expect(plugin).toBeTypeOf("object");
    expect(plugin.name).toBe("mongez-vite");
  });

  it("wires `config`, `transformIndexHtml`, and `writeBundle` hooks", () => {
    const plugin = mongezVite() as any;
    expect(plugin.config).toBeTypeOf("function");
    expect(plugin.transformIndexHtml).toBeTypeOf("function");
    expect(plugin.writeBundle).toBeTypeOf("object");
    expect(plugin.writeBundle.handler).toBeTypeOf("function");
  });

  it("declares `writeBundle` as `sequential: true`", () => {
    // Sequential is required for the post-build steps (htaccess + zip) to
    // run AFTER Vite has finished emitting assets to the outDir, not
    // interleaved with other plugins' writeBundle hooks.
    const plugin = mongezVite() as any;
    expect(plugin.writeBundle.sequential).toBe(true);
  });

  it("works with no options (defaults applied)", () => {
    expect(() => mongezVite()).not.toThrow();
    expect(() => mongezVite({})).not.toThrow();
  });

  it("accepts custom options without throwing", () => {
    expect(() =>
      mongezVite({
        baseUrl: "https://example.com",
        autoOpenBrowser: false,
        compressBuild: false,
        htaccess: false,
        linkTsconfigPaths: false,
        htmlEnvPrefix: "%",
        htmlEnvSuffix: "%",
      }),
    ).not.toThrow();
  });

  it("config() hook returns the (mutated) config back to Vite", () => {
    const plugin = mongezVite({
      autoOpenBrowser: false,
      linkTsconfigPaths: false,
      compressBuild: false,
      htaccess: false,
    }) as any;
    const input: any = {};
    const result = plugin.config(input, { command: "serve", mode: "development" });
    // Vite's `config` hook returns the (possibly mutated) config object so
    // the runner can merge it. We assert the contract holds.
    expect(result).toBe(input);
  });

  it("transformIndexHtml() is a pure function — same input produces same output", () => {
    const plugin = mongezVite({
      htmlEnvPrefix: "__",
      htmlEnvSuffix: "__",
    }) as any;
    const html = "<title>__APP_NAME__</title>";
    const a = plugin.transformIndexHtml(html);
    const b = plugin.transformIndexHtml(html);
    expect(a).toBe(b);
  });
});
