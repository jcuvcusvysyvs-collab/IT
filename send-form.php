<?php
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(array("ok" => false, "error" => "method"));
  exit;
}

if (!empty($_POST["website"])) {
  echo json_encode(array("ok" => true));
  exit;
}

function field($key) {
  if (!isset($_POST[$key])) {
    return "";
  }
  $value = is_array($_POST[$key]) ? implode(", ", $_POST[$key]) : $_POST[$key];
  return trim(str_replace(array("\r", "\n"), " ", (string) $value));
}

$name = field("name");
$email = field("email");
$company = field("company");
$phone = field("phone");
$phoneCountry = field("phone_country");
$message = isset($_POST["message"]) ? trim((string) $_POST["message"]) : "";
$page = field("page");
$source = field("source");

$interests = array();
if (isset($_POST["interests"]) && is_array($_POST["interests"])) {
  foreach ($_POST["interests"] as $item) {
    $item = trim((string) $item);
    if ($item !== "") {
      $interests[] = $item;
    }
  }
} elseif (isset($_POST["interests[]"]) && is_array($_POST["interests[]"])) {
  foreach ($_POST["interests[]"] as $item) {
    $item = trim((string) $item);
    if ($item !== "") {
      $interests[] = $item;
    }
  }
}

if ($name === "" || $email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(array("ok" => false, "error" => "validation"));
  exit;
}

$to = "obrainov@yandex.ru";
$subject = "Заявка с сайта: Инфраструктурные решения";
$encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";

$lines = array(
  "Источник: " . ($source !== "" ? $source : "Инфраструктурные решения"),
  "Страница: " . ($page !== "" ? $page : ""),
  "Имя: " . $name,
  "Компания: " . ($company !== "" ? $company : "—"),
  "Email: " . $email,
  "Телефон: " . trim($phoneCountry . " " . $phone),
  "Интересы: " . ($interests ? implode(", ", $interests) : "—"),
  "",
  "Сообщение:",
  $message !== "" ? $message : "—",
);

$body = implode("\n", $lines);

$headers = array(
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: 8bit",
  "From: DC Engineering <obrainov@yandex.ru>",
  "Reply-To: " . $name . " <" . $email . ">",
  "X-Mailer: DC-Engineering-Site",
);

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
  http_response_code(500);
  echo json_encode(array("ok" => false, "error" => "mail"));
  exit;
}

echo json_encode(array("ok" => true));
