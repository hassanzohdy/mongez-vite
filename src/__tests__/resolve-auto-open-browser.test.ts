/**
 * `resolveAutoOpenBrowser` tests.
 *
 * The helper mutates the provided Vite UserConfig in-place. It should:
 *   - Set `server.open = true` ONLY during `vite serve` (dev), never
 *     during `vite build`.
 *   - Be a no-op when the option is disabled.
 *   - Be a no-op when the user has already provided an explicit
 *     `server.open` value (true or false).
 */
import { describe, expect, it } from "vitest";
import resolveAutoOpenBrowser from "../resolveAutoOpenBrowser";

describe("resolveAutoOpenBrowser", () => {
  it("sets server.open=true during `vite serve` when option is on", () => {
    const config: any = {};
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: true });
    expect(config.server?.open).toBe(true);
  });

  it("creates the `server` object lazily if missing", () => {
    const config: any = {};
    expect(config.server).toBeUndefined();
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: true });
    expect(config.server).toBeTypeOf("object");
    expect(config.server.open).toBe(true);
  });

  it("does NOTHING during `vite build`", () => {
    const config: any = {};
    resolveAutoOpenBrowser(config, "build", { autoOpenBrowser: true });
    expect(config.server).toBeUndefined();
  });

  it("does NOTHING when autoOpenBrowser is false", () => {
    const config: any = {};
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: false });
    expect(config.server).toBeUndefined();
  });

  it("does NOT overwrite an explicit user-provided server.open=true", () => {
    const config: any = { server: { open: true } };
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: true });
    // Still true — but the helper short-circuited, so the property
    // wasn't reassigned. Sanity check.
    expect(config.server.open).toBe(true);
  });

  it("does NOT overwrite an explicit user-provided server.open=false", () => {
    // This is the important one: the user said "don't open my browser."
    // The helper must respect that.
    const config: any = { server: { open: false } };
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: true });
    expect(config.server.open).toBe(false);
  });

  it("preserves other `server` config the user provided", () => {
    const config: any = { server: { port: 4000 } };
    resolveAutoOpenBrowser(config, "serve", { autoOpenBrowser: true });
    expect(config.server.port).toBe(4000);
    expect(config.server.open).toBe(true);
  });
});
