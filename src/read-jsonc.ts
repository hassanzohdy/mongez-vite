import { readFileSync } from "node:fs";

/**
 * Parse a JSON-with-comments document, the format `tsconfig.json` is written
 * in: `//` and `/* *\/` comments and trailing commas are allowed. Comment
 * markers inside strings are kept.
 */
export function parseJsonc(source: string): any {
  let output = "";
  let inString = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (inString) {
      output += char;
      if (char === "\\") {
        output += next ?? "";
        index++;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
    } else if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index++;
      output += "\n";
    } else if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index++;
      index++;
    } else {
      output += char;
    }
  }

  return JSON.parse(withoutTrailingCommas(output));
}

/** Drop a comma whose next non-space character closes an object or array (outside strings). */
function withoutTrailingCommas(source: string): string {
  let output = "";
  let inString = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];

    if (inString) {
      output += char;
      if (char === "\\") output += source[++index] ?? "";
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;

    if (char === ",") {
      let ahead = index + 1;
      while (ahead < source.length && /\s/.test(source[ahead])) ahead++;
      if (source[ahead] === "}" || source[ahead] === "]") continue;
    }

    output += char;
  }

  return output;
}

export function readJsoncFile(path: string): any {
  return parseJsonc(readFileSync(path, "utf8"));
}
