/**
 * `generatePreRenderContent` tests.
 *
 * The function builds a small PHP file that proxies crawler requests to a
 * prerender service URL with a few query params (`url`, `delay`, `cache`).
 * These are pure-template assertions on the produced string.
 */
import { describe, expect, it } from "vitest";
import generatePreRenderContent from "../prerender";

describe("generatePreRenderContent", () => {
  it("embeds the prerender URL into the generated PHP", () => {
    const out = generatePreRenderContent({
      prerenderUrl: "https://my-prerender.example.com",
      cache: false,
      delay: 5000,
    });
    expect(out).toContain("$prerenderUrl = 'https://my-prerender.example.com'");
  });

  it("embeds delay + cache as query-string interpolations", () => {
    const out = generatePreRenderContent({
      prerenderUrl: "https://x.example.com",
      cache: true,
      delay: 2500,
    });
    expect(out).toContain("'delay' => 2500");
    expect(out).toContain("'cache' => true");
  });

  it("opens with `<?php` and emits an `echo $content;` tail", () => {
    const out = generatePreRenderContent({
      prerenderUrl: "https://x.example.com",
      cache: false,
      delay: 5000,
    });
    expect(out.trimStart().startsWith("<?php")).toBe(true);
    expect(out.trim().endsWith("echo $content;")).toBe(true);
  });

  it("includes the curl-based fetch helper", () => {
    // The generated PHP defines `function get_content($URL)` that wraps
    // curl. Regressions here would silently break SSR for crawlers.
    const out = generatePreRenderContent({
      prerenderUrl: "https://x.example.com",
      cache: false,
      delay: 5000,
    });
    expect(out).toContain("function get_content($URL)");
    expect(out).toContain("curl_init()");
    expect(out).toContain("CURLOPT_RETURNTRANSFER");
  });

  it("forwards the User-Agent header to the prerender service", () => {
    const out = generatePreRenderContent({
      prerenderUrl: "https://x.example.com",
      cache: false,
      delay: 5000,
    });
    expect(out).toContain("$_SERVER['HTTP_USER_AGENT']");
    expect(out).toContain("__agent");
  });
});
