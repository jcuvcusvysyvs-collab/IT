<?php
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(array("ok" => false, "error" => "method"));
  exit;
}

$raw = file_get_contents("php://input");
$input = array();
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";

if (stripos($contentType, "application/json") !== false) {
  $decoded = json_decode($raw, true);
  if (is_array($decoded)) {
    $input = $decoded;
  }
} else {
  $input = $_POST;
}

if (!empty($input["website"])) {
  echo json_encode(array("ok" => true));
  exit;
}

function field($data, $key) {
  if (!isset($data[$key])) {
    return "";
  }
  $value = is_array($data[$key]) ? implode(", ", $data[$key]) : $data[$key];
  return trim(str_replace(array("\r", "\n"), " ", (string) $value));
}

$name = field($input, "name");
$email = field($input, "email");
$company = field($input, "company");
$phone = field($input, "phone");
$interests = field($input, "interests");
$message = isset($input["message"]) ? trim((string) $input["message"]) : "";
$page = field($input, "page");
$source = field($input, "source");

if ($name === "" || $email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(array("ok" => false, "error" => "validation"));
  exit;
}

$configFile = __DIR__ . "/send-form.config.php";
if (!is_file($configFile)) {
  http_response_code(500);
  echo json_encode(array("ok" => false, "error" => "config_missing"));
  exit;
}

$config = include $configFile;
$smtpUser = isset($config["smtp_user"]) ? trim((string) $config["smtp_user"]) : "";
$smtpPass = isset($config["smtp_pass"]) ? (string) $config["smtp_pass"] : "";
$to = isset($config["to"]) ? trim((string) $config["to"]) : $smtpUser;

if ($smtpUser === "" || $smtpPass === "") {
  http_response_code(500);
  echo json_encode(array("ok" => false, "error" => "smtp_not_configured"));
  exit;
}

$subject = "Заявка с сайта: Инфраструктурные решения";
$lines = array(
  "Источник: " . ($source !== "" ? $source : "Инфраструктурные решения"),
  "Страница: " . ($page !== "" ? $page : ""),
  "Имя: " . $name,
  "Компания: " . ($company !== "" ? $company : "—"),
  "Email: " . $email,
  "Телефон: " . ($phone !== "" ? $phone : "—"),
  "Интересы: " . ($interests !== "" ? $interests : "—"),
  "",
  "Сообщение:",
  $message !== "" ? $message : "—",
);
$bodyText = implode("\n", $lines);

function smtp_read($fp) {
  $data = "";
  while (!feof($fp)) {
    $line = fgets($fp, 1024);
    if ($line === false) {
      break;
    }
    $data .= $line;
    if (isset($line[3]) && $line[3] === " ") {
      break;
    }
  }
  return $data;
}

function smtp_cmd($fp, $command, $expect) {
  fwrite($fp, $command . "\r\n");
  $resp = smtp_read($fp);
  if (strpos($resp, (string) $expect) !== 0) {
    throw new Exception(trim($resp));
  }
  return $resp;
}

function smtp_send_yandex($config, $to, $replyTo, $replyName, $subject, $bodyText) {
  $host = isset($config["smtp_host"]) ? $config["smtp_host"] : "smtp.mail.ru";
  $port = isset($config["smtp_port"]) ? (int) $config["smtp_port"] : 465;
  $user = $config["smtp_user"];
  $pass = $config["smtp_pass"];
  $fromName = isset($config["from_name"]) ? $config["from_name"] : "DC Engineering";

  $remote = "ssl://" . $host . ":" . $port;
  $fp = @stream_socket_client(
    $remote,
    $errno,
    $errstr,
    20,
    STREAM_CLIENT_CONNECT,
    stream_context_create(array("ssl" => array("verify_peer" => true, "verify_peer_name" => true)))
  );
  if (!$fp) {
    throw new Exception("connect: " . $errstr);
  }
  stream_set_timeout($fp, 20);
  smtp_read($fp);
  smtp_cmd($fp, "EHLO dce.su", 250);
  smtp_cmd($fp, "AUTH LOGIN", 334);
  smtp_cmd($fp, base64_encode($user), 334);
  smtp_cmd($fp, base64_encode($pass), 235);
  smtp_cmd($fp, "MAIL FROM:<" . $user . ">", 250);
  smtp_cmd($fp, "RCPT TO:<" . $to . ">", 250);
  smtp_cmd($fp, "DATA", 354);

  $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
  $encodedFrom = "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $user . ">";
  $headers = array(
    "From: " . $encodedFrom,
    "To: <" . $to . ">",
    "Reply-To: " . $replyName . " <" . $replyTo . ">",
    "Subject: " . $encodedSubject,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
  );
  $payload = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $bodyText) . "\r\n.";
  smtp_cmd($fp, $payload, 250);
  fwrite($fp, "QUIT\r\n");
  fclose($fp);
}

try {
  smtp_send_yandex($config, $to, $email, $name, $subject, $bodyText);
  echo json_encode(array("ok" => true));
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(array("ok" => false, "error" => "smtp", "detail" => $e->getMessage()));
}
