<?php
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");

register_shutdown_function(function () {
  $error = error_get_last();
  if (!$error) {
    return;
  }
  $fatal = array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR);
  if (!in_array($error["type"], $fatal, true)) {
    return;
  }
  if (!headers_sent()) {
    header("Content-Type: application/json; charset=utf-8", true, 500);
  }
  echo json_encode(array(
    "ok" => false,
    "error" => "php_fatal",
    "detail" => $error["message"],
  ));
});

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  echo json_encode(array(
    "ok" => true,
    "service" => "send-form",
    "php" => PHP_VERSION,
    "mail" => function_exists("mail"),
  ));
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(array("ok" => false, "error" => "method"));
  exit;
}

$raw = file_get_contents("php://input");
$input = $_POST;
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";
if (stripos($contentType, "application/json") !== false) {
  $decoded = json_decode($raw, true);
  if (is_array($decoded)) {
    $input = $decoded;
  }
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

$phoneDigits = preg_replace("/\\D+/", "", $phone);
$hasEmail = $email !== "" && filter_var($email, FILTER_VALIDATE_EMAIL);
$hasPhone = strlen($phoneDigits) >= 10;

if ($name === "" || (!$hasEmail && !$hasPhone)) {
  http_response_code(400);
  echo json_encode(array("ok" => false, "error" => "validation"));
  exit;
}

$config = array();
$configFile = dirname(__FILE__) . "/send-form.config.php";
if (is_file($configFile)) {
  $loaded = include $configFile;
  if (is_array($loaded)) {
    $config = $loaded;
  }
}

$to = isset($config["to"]) ? trim((string) $config["to"]) : "kislinskiy.stas00@mail.ru";
$fromEmail = isset($config["from_email"]) ? trim((string) $config["from_email"]) : "info@dce.su";
$fromName = isset($config["from_name"]) ? trim((string) $config["from_name"]) : "DC Engineering";
$smtpPass = isset($config["smtp_pass"]) ? (string) $config["smtp_pass"] : "";
$replyTo = $hasEmail ? $email : $fromEmail;

$subject = "Заявка с сайта: " . ($source !== "" ? $source : "DC Engineering");
$lines = array(
  "Источник: " . ($source !== "" ? $source : "Инфраструктурные решения"),
  "Страница: " . ($page !== "" ? $page : ""),
  "Имя: " . $name,
  "Компания: " . ($company !== "" ? $company : "-"),
  "Email: " . $email,
  "Телефон: " . ($phone !== "" ? $phone : "-"),
  "Интересы: " . ($interests !== "" ? $interests : "-"),
  "",
  "Сообщение:",
  $message !== "" ? $message : "-",
);
$bodyText = implode("\n", $lines);
$encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
$encodedFrom = "=?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">";

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

function smtp_send($config, $to, $replyTo, $replyName, $subject, $bodyText) {
  $host = isset($config["smtp_host"]) ? $config["smtp_host"] : "smtp.mail.ru";
  $port = isset($config["smtp_port"]) ? (int) $config["smtp_port"] : 465;
  $user = $config["smtp_user"];
  $pass = $config["smtp_pass"];
  $fromName = isset($config["from_name"]) ? $config["from_name"] : "DC Engineering";

  $fp = @stream_socket_client(
    "ssl://" . $host . ":" . $port,
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
  smtp_cmd($fp, implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $bodyText) . "\r\n.", 250);
  fwrite($fp, "QUIT\r\n");
  fclose($fp);
}

function h($value) {
  return htmlspecialchars((string) $value, ENT_QUOTES, "UTF-8");
}

function brand_email_html($name, $email, $company, $phone, $interests, $message, $page) {
  $rows = array(
    "Имя" => $name,
    "Компания" => $company !== "" ? $company : "—",
    "Почта" => $email,
    "Телефон" => $phone !== "" ? $phone : "—",
    "Что интересует" => $interests !== "" ? $interests : "—",
    "Сообщение" => $message !== "" ? $message : "—",
    "Страница" => $page !== "" ? $page : "—",
  );
  $rowHtml = "";
  foreach ($rows as $label => $value) {
    $rowHtml .=
      '<tr>' .
      '<td style="padding:12px 0;border-bottom:1px solid #e6eaf2;width:38%;color:#6b7280;font-size:13px;vertical-align:top;">' . h($label) . '</td>' .
      '<td style="padding:12px 0;border-bottom:1px solid #e6eaf2;color:#0f141c;font-size:15px;font-weight:600;vertical-align:top;">' . nl2br(h($value)) . '</td>' .
      '</tr>';
  }

  return '<!DOCTYPE html><html lang="ru"><body style="margin:0;padding:0;background:#f4f6fa;">' .
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 12px;">' .
    '<tr><td align="center">' .
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6eaf2;">' .
    '<tr><td style="background:#032477;padding:28px 32px;">' .
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9db4e8;">DC Engineering</div>' .
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;margin-top:8px;">Новая заявка с сайта</div>' .
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#d5def0;margin-top:6px;">Инфраструктурные решения</div>' .
    '</td></tr>' .
    '<tr><td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;">' .
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rowHtml . '</table>' .
    '</td></tr>' .
    '<tr><td style="padding:16px 32px 24px;background:#f7f9fc;color:#6b7280;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;">' .
    'Ответьте на это письмо, чтобы связаться с клиентом. Сообщение сформировано автоматически с сайта DC Engineering.' .
    '</td></tr>' .
    '</table></td></tr></table></body></html>';
}

function brand_email_payload($fromHeader, $to, $replyName, $replyTo, $subject, $bodyText, $bodyHtml) {
  $boundary = "dce-" . md5($subject . microtime(true));
  $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
  $headers = array(
    "From: " . $fromHeader,
    "To: <" . $to . ">",
    "Reply-To: " . $replyName . " <" . $replyTo . ">",
    "Subject: " . $encodedSubject,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"",
  );
  $body =
    "--" . $boundary . "\r\n" .
    "Content-Type: text/plain; charset=UTF-8\r\n" .
    "Content-Transfer-Encoding: 8bit\r\n\r\n" .
    str_replace("\n", "\r\n", $bodyText) . "\r\n" .
    "--" . $boundary . "\r\n" .
    "Content-Type: text/html; charset=UTF-8\r\n" .
    "Content-Transfer-Encoding: 8bit\r\n\r\n" .
    str_replace("\n", "\r\n", $bodyHtml) . "\r\n" .
    "--" . $boundary . "--";
  return array($headers, $body, $encodedSubject);
}

$bodyHtml = brand_email_html($name, $email, $company, $phone, $interests, $message, $page);

try {
  if ($smtpPass !== "") {
    smtp_send($config, $to, $replyTo, $name, $subject, $bodyText);
    echo json_encode(array("ok" => true, "via" => "smtp"));
    exit;
  }

  $payload = brand_email_payload($encodedFrom, $to, $name, $replyTo, $subject, $bodyText, $bodyHtml);
  $sent = false;
  if (function_exists("mail")) {
    $sent = @mail($to, $payload[2], $payload[1], implode("\r\n", $payload[0]));
  }

  if (!$sent) {
    http_response_code(500);
    echo json_encode(array("ok" => false, "error" => "mail_disabled"));
    exit;
  }

  echo json_encode(array("ok" => true, "via" => "mail"));
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(array("ok" => false, "error" => "smtp", "detail" => $e->getMessage()));
}
