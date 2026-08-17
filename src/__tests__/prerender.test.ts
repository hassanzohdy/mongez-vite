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

  describe("hostile `prerenderUrl` values cannot break out of the PHP string literal", () => {
    it("escapes a single-quote breakout payload instead of executing it", () => {
      const payload = "https://x.example.com'; system('id'); //";
      const out = generatePreRenderContent({
        prerenderUrl: payload,
        cache: false,
        delay: 5000,
      });

      // The raw, unescaped payload must never appear verbatim in the output.
      expect(out).not.toContain(`'${payload}'`);
      // Every single quote in the payload must be backslash-escaped, so the
      // generated line stays a single PHP string literal assignment.
      expect(out).toContain(
        "$prerenderUrl = 'https://x.example.com\\'; system(\\'id\\'); //';"
      );
      // The assignment line must not contain an *unescaped* quote followed
      // by the payload's trailing PHP statement — that would mean the
      // literal was broken out of and `system(...)` became live code.
      const assignmentLine = out
        .split("\n")
        .find((line) => line.includes("$prerenderUrl ="));
      expect(assignmentLine).not.toMatch(/[^\\]'; system\('id'\); \/\//);
    });

    it("escapes a bare double quote", () => {
      const out = generatePreRenderContent({
        prerenderUrl: '"',
        cache: false,
        delay: 5000,
      });

      expect(out).toContain("$prerenderUrl = '\"';");
    });

    it("does not treat `${x}`-style sequences as interpolation breakout", () => {
      const out = generatePreRenderContent({
        prerenderUrl: "https://x.example.com/${x}",
        cache: false,
        delay: 5000,
      });

      expect(out).toContain(
        "$prerenderUrl = 'https://x.example.com/${x}';"
      );
    });

    it("escapes backslashes so an attacker cannot neutralize the quote escape", () => {
      const out = generatePreRenderContent({
        prerenderUrl: "https://x.example.com\\'; system('id'); //",
        cache: false,
        delay: 5000,
      });

      expect(out).toContain(
        "$prerenderUrl = 'https://x.example.com\\\\\\'; system(\\'id\\'); //';"
      );
    });

    it("still renders normal URLs unchanged", () => {
      const out = generatePreRenderContent({
        prerenderUrl: "https://render.mentoor.io",
        cache: true,
        delay: 5000,
      });

      expect(out).toContain("$prerenderUrl = 'https://render.mentoor.io';");
    });
  });

  describe("hostile `delay`/`cache` values cannot break out of the PHP array literal", () => {
    it("falls back to the documented default delay for a non-numeric injection payload", () => {
      const out = generatePreRenderContent({
        prerenderUrl: "https://x.example.com",
        cache: false,
        delay: "5000, 'x' => shell_exec($_GET[0]),",
      });

      expect(out).toContain("'delay' => 5000,");
      expect(out).not.toContain("shell_exec");
    });

    it("coerces a non-boolean injection payload for cache to a literal `false`", () => {
      const out = generatePreRenderContent({
        prerenderUrl: "https://x.example.com",
        cache: "true, 'x' => shell_exec($_GET[0]),",
        delay: 5000,
      });

      expect(out).toContain("'cache' => false,");
      expect(out).not.toContain("shell_exec");
    });
  });
});
