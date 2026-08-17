// Escapes a value for safe embedding inside a single-quoted PHP string
// literal. PHP single-quoted strings only treat `\` and `'` specially (no
// variable interpolation), so escaping those two is sufficient to prevent
// breaking out of the literal.
function toPhpSingleQuotedString(value: unknown): string {
  const stringValue = String(value ?? "");

  return `'${stringValue.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

// Coerces a value to a finite number literal, falling back to `5000` (the
// documented default) for anything else so a non-numeric `delay` can't be
// used to break out of the generated PHP array literal.
function toPhpNumberLiteral(value: unknown, fallback: number): string {
  const numberValue = typeof value === "number" ? value : Number(value);

  return String(Number.isFinite(numberValue) ? numberValue : fallback);
}

// Coerces a value to a PHP boolean literal (`true`/`false`) so a
// non-boolean `cache` can't be used to break out of the generated PHP
// array literal.
function toPhpBooleanLiteral(value: unknown): string {
  return value === true ? "true" : "false";
}

export default function generatePreRenderContent({
  prerenderUrl,
  cache,
  delay,
}) {
  const phpPrerenderUrl = toPhpSingleQuotedString(prerenderUrl);
  const phpDelay = toPhpNumberLiteral(delay, 5000);
  const phpCache = toPhpBooleanLiteral(cache);

  return `<?php

  function get_content($URL)
  {
      $hashedUrl = sha1($URL);
  
      $cachedPagesDirectory = __DIR__ . '/cache';
      $cachedFile = $cachedPagesDirectory . '/' . $hashedUrl . '.html';
  
      if (file_exists($cachedFile)) {
          $file = file_get_contents($cachedFile);
          if ($file) {
              return $file;
          }
      }
  
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
  
      curl_setopt($ch, CURLOPT_URL, $URL);
      $data = curl_exec($ch);
  
      curl_close($ch);
  
      if (!file_exists($cachedPagesDirectory)) {
          mkdir($cachedPagesDirectory, 0777, true);
      }
  
      file_put_contents($cachedFile, $data);
  
      return $data;
  }

$prerenderUrl = ${phpPrerenderUrl};

$url = $_SERVER['SCRIPT_URI'] ?? $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'];

if (! empty($_GET)) {
    $url .= '?' . http_build_query($_GET);
}

// for arabic letters and utf8 in general
$url = urlencode($url);

$userAgent = $_SERVER['HTTP_USER_AGENT'];

$params = [
    'url' => $url,
    'delay' => ${phpDelay},
    'cache' => ${phpCache},
    '__agent' => $userAgent,
];

$url = "$prerenderUrl?" . http_build_query($params);

$content = get_content($url);

echo $content;`;
}
