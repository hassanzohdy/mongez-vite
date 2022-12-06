<?php

function get_content($URL)
{
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

  curl_setopt($ch, CURLOPT_URL, $URL);
  $data = curl_exec($ch);

  curl_close($ch);
  return $data;
}

$prerenderUrl = "https://render.mentoor.io";

$url = $_SERVER['SCRIPT_URI'];

if (! empty($_GET)) {
    $url .= '?' . http_build_query($_GET);
}

// for arabic letters and utf8 in general
$url = urlencode($url);

$userAgent = $_SERVER['HTTP_USER_AGENT'];

$params = [
    'url' => $url,
    '__agent' => $userAgent
];

$url = "$prerenderUrl?" . http_build_query($params);

$content = get_content($url);

echo $content;
