# Заливка сайта на рег.ру

Сайт статический (HTML/CSS/JS) + PHP для форм (`send-form.php`).

| Этап | Домен | robots |
|------|--------|--------|
| Сейчас | **engiineer.space** | закрыт (`Disallow: /`) |
| Позже | **dce.su** | открыт |

## 1. Собрать ZIP

Из корня проекта:

```bash
python scripts/make-deploy-zip.py --domain=engiineer.space
```

Позже для продакшена:

```bash
python scripts/make-deploy-zip.py --domain=dce.su --allow-index
```

В ZIP **не** попадают: `.git`, `scripts`, `_partials`, `update.bat`, неиспользуемое видео `video/data-center-Q3B4L7N.mp4`, этот файл инструкции.

Появляются/обновляются в корне: `robots.txt`, `sitemap.xml`, `.htaccess`.

## 2. Панель рег.ру (тест engiineer.space)

1. Домен привязан к хостингу, DNS указывает на сервер.
2. Включить **SSL (Let's Encrypt)** для engiineer.space.
3. В файловом менеджере открыть каталог сайта **engiineer.space** (корень сайта).
4. Загрузить и распаковать ZIP так, чтобы `index.html` лежал **в корне сайта**, а не во вложенной папке вроде `Сайт ДИСИ_rabochiy/`.
5. Убедиться, что на сервере есть: `index.html`, `.htaccess`, `send-form.php`, `send-form.config.php`, папки `images/`, `video/`, `vendor/`.

## 3. Почта форм

1. На сервере открыть `send-form.config.php`.
2. Вписать `smtp_pass` — пароль приложения Mail.ru (или SMTP почты рег.ру).
3. Не хранить заполненный пароль в git.
4. Проверить отправку:
   - форма на `/contacts.html`
   - «Перезвонить» в шапке
   - форма Huawei на `/huawei-service-center.html`

Если SMTP не настроен, PHP может упасть на `mail()` / SMTP; тогда JS попытается FormSubmit (нужно один раз подтвердить письмо на inbox).

## 4. Чеклист после заливки

- [ ] https://engiineer.space/ открывается
- [ ] HTTP редиректит на HTTPS
- [ ] Случайный URL даёт свою 404 (`/404.html`)
- [ ] Картинки и видео грузятся
- [ ] Формы приходят на почту
- [ ] Мобильная вёрстка ок

## 5. Позже — перенос на dce.su

1. Привязать **dce.su** к хостингу, DNS, SSL.
2. Собрать ZIP: `python scripts/make-deploy-zip.py --domain=dce.su --allow-index`
3. Залить в каталог сайта dce.su.
4. Снова прописать `smtp_pass` на сервере (если другой аккаунт/корень).
5. При необходимости завести ящик `info@dce.su` и обновить `from_email` / SMTP в конфиге.
