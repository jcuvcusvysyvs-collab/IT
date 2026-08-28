(function () {
  "use strict";

  var TEST_INBOX = "kislinskiy.stas00@mail.ru";
  var STATIC_HOST =
    /github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) ||
    location.protocol === "file:";
  var POLICY_HREF = "images/documents/persdata_policy.pdf";

  var root = null;
  var panel = null;
  var form = null;
  var statusEl = null;
  var submitBtn = null;
  var lastFocus = null;
  var open = false;

  function qs(sel, node) {
    return (node || document).querySelector(sel);
  }

  function setStatus(type, text) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.className = "callback-modal__status" + (type ? " is-" + type : "");
  }

  function focusables() {
    if (!panel) return [];
    return Array.prototype.slice.call(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function openModal() {
    if (!root) return;
    lastFocus = document.activeElement;
    root.classList.remove("is-done");
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("callback-modal-open");
    document.body.classList.add("callback-modal-open");
    open = true;
    setStatus("", "");
    window.setTimeout(function () {
      var name = qs("#callback-name", root);
      if (name) name.focus();
    }, 40);
  }

  function closeModal() {
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("callback-modal-open");
    document.body.classList.remove("callback-modal-open");
    open = false;
    if (form && root.classList.contains("is-done")) {
      form.reset();
      root.classList.remove("is-done");
    }
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function digits(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function parseJson(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function sendViaPhp(payload) {
    return fetch("send-form.php", {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    }).then(function (response) {
      return response.text().then(function (raw) {
        var result = parseJson(raw);
        if (result && result.ok) return result;
        var err = new Error("mail");
        err.code = result && result.error ? result.error : "mail";
        throw err;
      });
    });
  }

  function sendViaFormsubmit(data) {
    var body = new FormData();
    body.append("_captcha", "false");
    body.append("_template", "box");
    body.append("_subject", "DC Engineering — перезвонить");
    body.append("Имя", data.name);
    body.append("Телефон", data.phone);
    body.append("Страница", data.page);
    body.append("Источник", data.source);
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(TEST_INBOX), {
      method: "POST",
      body: body,
      headers: { Accept: "application/json" },
    }).then(function (response) {
      return response.json().then(function (result) {
        if (result && (result.success === "true" || result.success === true)) return result;
        throw new Error("mail");
      });
    });
  }

  function showDone() {
    if (!root) return;
    root.classList.add("is-done");
    var close = qs("[data-callback-close]", panel);
    if (close) close.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!form) return;

    var name = (qs("#callback-name", form).value || "").trim();
    var phone = (qs("#callback-phone", form).value || "").trim();
    var consent = qs("#callback-consent", form);
    var honey = qs('input[name="website"]', form);

    if (honey && honey.value) {
      showDone();
      return;
    }
    if (name.length < 2) {
      setStatus("error", "Укажите имя.");
      qs("#callback-name", form).focus();
      return;
    }
    if (digits(phone).length < 10) {
      setStatus("error", "Укажите телефон полностью.");
      qs("#callback-phone", form).focus();
      return;
    }
    if (!consent || !consent.checked) {
      setStatus("error", "Нужно согласие на обработку данных.");
      consent.focus();
      return;
    }

    var data = {
      name: name,
      phone: phone,
      email: "",
      company: "",
      interests: "—",
      message: "Просьба перезвонить",
      page: window.location.href,
      source: "Шапка — перезвонить",
    };

    submitBtn.disabled = true;
    setStatus("", "Отправляем…");

    var payload = new FormData();
    Object.keys(data).forEach(function (key) {
      payload.append(key, data[key]);
    });

    var send = STATIC_HOST ? sendViaFormsubmit(data) : sendViaPhp(payload);
    send
      .then(function () {
        showDone();
        setStatus("success", "");
      })
      .catch(function () {
        if (!STATIC_HOST) {
          return sendViaFormsubmit(data).then(function () {
            showDone();
            setStatus("success", "");
          });
        }
        throw new Error("mail");
      })
      .catch(function () {
        setStatus("error", "Не удалось отправить. Позвоните: 8 495 108-61-56");
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  }

  function onKey(event) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function mount() {
    if (document.getElementById("callback-modal")) return;

    root = document.createElement("div");
    root.id = "callback-modal";
    root.className = "callback-modal";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<button type="button" class="callback-modal__scrim" data-callback-close tabindex="-1" aria-label="Закрыть окно"></button>' +
      '<div class="callback-modal__panel" role="dialog" aria-modal="true" aria-labelledby="callback-title">' +
      '<button type="button" class="callback-modal__close" data-callback-close aria-label="Закрыть"></button>' +
      '<p class="callback-modal__eyebrow">Обратная связь</p>' +
      '<h2 class="callback-modal__title" id="callback-title">Перезвоним вам</h2>' +
      '<p class="callback-modal__lead">Оставьте имя и телефон — инженер свяжется в рабочий день.</p>' +
      '<div class="callback-modal__done">' +
      '<p class="callback-modal__done-title">Заявка отправлена</p>' +
      '<p class="callback-modal__done-text">Спасибо. Перезвоним в ближайший рабочий день, обычно до 18:00.</p>' +
      "</div>" +
      '<form class="callback-modal__form" id="callback-form" novalidate>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;height:0;width:0;opacity:0">' +
      '<label class="callback-modal__field">' +
      '<span class="callback-modal__label">Имя</span>' +
      '<input class="callback-modal__input" id="callback-name" name="name" type="text" autocomplete="name" placeholder="Иван Иванов" required>' +
      "</label>" +
      '<label class="callback-modal__field">' +
      '<span class="callback-modal__label">Телефон</span>' +
      '<input class="callback-modal__input" id="callback-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7 495 000-00-00" required>' +
      "</label>" +
      '<label class="callback-modal__consent">' +
      '<input class="callback-modal__checkbox" id="callback-consent" type="checkbox" name="consent" value="yes" required>' +
      '<span class="callback-modal__check" aria-hidden="true"></span>' +
      '<span class="callback-modal__consent-text">Я даю ООО «ДИСИ ИНЖИНИРИНГ» согласие на обработку персональных данных. <a href="' +
      POLICY_HREF +
      '" target="_blank" rel="noopener noreferrer">Политика</a></span>' +
      "</label>" +
      '<button type="submit" class="callback-modal__submit">Жду звонка</button>' +
      '<p class="callback-modal__status" id="callback-status" role="status" aria-live="polite"></p>' +
      "</form>" +
      "</div>";

    document.body.appendChild(root);
    panel = qs(".callback-modal__panel", root);
    form = qs("#callback-form", root);
    statusEl = qs("#callback-status", root);
    submitBtn = qs(".callback-modal__submit", form);

    root.addEventListener("click", function (event) {
      var closer = event.target && event.target.closest && event.target.closest("[data-callback-close]");
      if (!closer) return;
      event.preventDefault();
      event.stopPropagation();
      closeModal();
    });
    form.addEventListener("submit", onSubmit);
    document.addEventListener("keydown", onKey);
  }

  function bindTriggers() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-callback-open], .header-cta");
      if (!trigger) return;
      if (trigger.closest(".callback-modal")) return;
      event.preventDefault();
      openModal();
    });
  }

  function boot() {
    mount();
    bindTriggers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
