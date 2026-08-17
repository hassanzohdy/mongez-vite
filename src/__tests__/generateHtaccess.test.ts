/**
 * `generateHtaccess` security regression tests.
 *
 * `options.preRender.crawlers` is spliced into a live Apache `RewriteCond`
 * regex embedded in the generated `.htaccess`. A newline in `crawlers`
 * could previously inject arbitrary Apache directives into the file; a
 * missing `crawlers` value previously produced a literal `undefined` in
 * the regex.
 */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateHtaccess } from "../generateHtaccess";

const FIXTURES = path.join(__dirname, "fixtures", "generate-htaccess");

let originalCwd: string;

function fixtureDir(name: string): string {
  const dir = path.join(FIXTURES, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  originalCwd = process.cwd();
});

afterEach(() => {
  process.chdir(originalCwd);
});

describe("generateHtaccess() crawlers sanitization", () => {
  it("strips newlines from `crawlers` instead of injecting new Apache directives", async () => {
    const dir = fixtureDir("newline-injection");
    fs.mkdirSync(path.join(dir, "dist"), { recursive: true });
    process.chdir(dir);

    const injectedDirective = "Header set X-Injected evil";
    await generateHtaccess(
      { build: { outDir: "dist" } } as any,
      {
        htaccess: true,
        preRender: {
          url: "https://render.example.com",
          crawlers: `Googlebot\n${injectedDirective}\nRewriteRule .* /pwned [L]`,
        },
      },
    );

    const htaccess = fs.readFileSync(
      path.join(dir, "dist", ".htaccess"),
      "utf-8",
    );

    // The injected text must not appear on its own line/directive — it can
    // only survive folded into the single RewriteCond regex line.
    expect(htaccess).not.toMatch(/^Header set X-Injected evil$/m);
    expect(htaccess).not.toMatch(/^RewriteRule \.\* \/pwned \[L\]$/m);

    // The RewriteCond line stays a single, unbroken line.
    const rewriteCondLine = htaccess
      .split(/\r?\n/)
      .find((line) => line.includes("HTTP_USER_AGENT"));
    expect(rewriteCondLine).toContain("Googlebot");
    expect(rewriteCondLine).toContain(injectedDirective);
  });

  it("strips carriage returns and other control characters from `crawlers`", async () => {
    const dir = fixtureDir("cr-injection");
    fs.mkdirSync(path.join(dir, "dist"), { recursive: true });
    process.chdir(dir);

    await generateHtaccess(
      { build: { outDir: "dist" } } as any,
      {
        htaccess: true,
        preRender: {
          url: "https://render.example.com",
          crawlers: "Googlebot\r\nHeader set X-Injected evil",
        },
      },
    );

    const htaccess = fs.readFileSync(
      path.join(dir, "dist", ".htaccess"),
      "utf-8",
    );

    // The base .htaccess template itself uses CRLF line endings, so only
    // assert the RewriteCond line (built from the sanitized `crawlers`
    // value) is free of the carriage return that was in the payload, and
    // that no new standalone directive line was injected.
    const rewriteCondLine = htaccess
      .split(/\r?\n/)
      .find((line) => line.includes("HTTP_USER_AGENT"));
    expect(rewriteCondLine).not.toContain("\r");
    expect(rewriteCondLine).not.toContain("\n");
    expect(htaccess).not.toMatch(/^Header set X-Injected evil$/m);
  });

  it("falls back to the documented default crawlers list when `crawlers` is missing", async () => {
    const dir = fixtureDir("default-crawlers");
    fs.mkdirSync(path.join(dir, "dist"), { recursive: true });
    process.chdir(dir);

    await generateHtaccess(
      { build: { outDir: "dist" } } as any,
      {
        htaccess: true,
        preRender: {
          url: "https://render.example.com",
        },
      },
    );

    const htaccess = fs.readFileSync(
      path.join(dir, "dist", ".htaccess"),
      "utf-8",
    );

    expect(htaccess).not.toContain("undefined");
    expect(htaccess).toContain("Googlebot");
  });

  it("still renders a normal `crawlers` value unchanged", async () => {
    const dir = fixtureDir("normal-crawlers");
    fs.mkdirSync(path.join(dir, "dist"), { recursive: true });
    process.chdir(dir);

    await generateHtaccess(
      { build: { outDir: "dist" } } as any,
      {
        htaccess: true,
        preRender: {
          url: "https://render.example.com",
          crawlers: "Googlebot|bingbot",
        },
      },
    );

    const htaccess = fs.readFileSync(
      path.join(dir, "dist", ".htaccess"),
      "utf-8",
    );

    expect(htaccess).toContain(
      "RewriteCond %{HTTP_USER_AGENT} .*(Googlebot|bingbot).* [NC]",
    );
  });
});
