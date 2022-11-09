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

$path = ltrim($_GET['path'], '/');

unset($_GET['path']);

$prerenderUrl = "__PRENDER_URL__";

// for arabic letters and utf8 in general
$path = urldecode($path);

$domain = $_GET['domain'];

unset($_GET['domain']);

$userAgent = preg_split('/[\s\/\),-.]+/', $_SERVER['HTTP_USER_AGENT'])[0];

$url = 'https://' . $_SERVER['HTTP_HOST'] . '/' . $path;

if (! empty($_GET)) {
    $url .= '?' . http_build_query($_GET);
}

$_GET = [];

// for arabic letters and utf8 in general
$url = urlencode($url);

$_GET['url'] = $url;

$_GET['__agent'] = $userAgent;

$url = "$prerenderUrl?" . http_build_query($_GET);

$content = get_content($url);

echo $content;
