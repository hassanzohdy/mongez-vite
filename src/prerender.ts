export default function generatePreRenderContent({
  prerenderUrl,
  cache,
  delay,
}) {
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
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  
      curl_setopt($ch, CURLOPT_URL, $URL);
      $data = curl_exec($ch);
  
      curl_close($ch);
  
      if (!file_exists($cachedPagesDirectory)) {
          mkdir($cachedPagesDirectory, 0777, true);
      }
  
      file_put_contents($cachedFile, $data);
  
      return $data;
  }

$prerenderUrl = '${prerenderUrl}';

$url = $_SERVER['SCRIPT_URI'] ?? $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'];

if (! empty($_GET)) {
    $url .= '?' . http_build_query($_GET);
}

// for arabic letters and utf8 in general
$url = urlencode($url);

$userAgent = $_SERVER['HTTP_USER_AGENT'];

$params = [
    'url' => $url,
    'delay' => ${delay},
    'cache' => ${cache},
    '__agent' => $userAgent,
];

$url = "$prerenderUrl?" . http_build_query($params);

$content = get_content($url);

echo $content;`;
}
