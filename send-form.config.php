<?php
/**
 * Почтовый конфиг для send-form.php.
 *
 * На сервере рег.ру после заливки заполните smtp_pass паролем приложения
 * (Mail.ru → Пароль для внешнего приложения) или SMTP почты рег.ру.
 * Пароль в git / ZIP из репозитория не коммитить заполненным.
 */
return array(
  "to" => "kislinskiy.stas00@mail.ru",
  "from_name" => "DC Engineering",
  "from_email" => "info@dce.su",
  "smtp_host" => "smtp.mail.ru",
  "smtp_port" => 465,
  "smtp_user" => "kislinskiy.stas00@mail.ru",
  "smtp_pass" => "",
);
