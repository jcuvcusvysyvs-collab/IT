(function () {
  "use strict";

  var TEST_INBOX = "kislinskiy.stas00@mail.ru";
  var STATIC_HOST =
    /github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) ||
    location.protocol === "file:";
  var POLICY_HREF = "images/documents/persdata_policy.pdf";

  var form = document.getElementById("footer-newsletter-form");
  if (!form) return;

  var statusEl = document.getElementById("footer-newsletter-status");
  var submitBtn = form.querySelector(".footer-newsletter__submit");
  var nameInput = form.querySelector('input[name="name"]');
  var emailInput = form.querySelector('input[name="email"]');
  var consentInput = form.querySelector('input[name="consent"]');
  var consentLabel = form.querySelector(".footer-newsletter__consent");

  function setStatus(type, text) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.className = "footer-newsletter__status" + (type ? " is-" + type : "");
  }

  function setConsentInvalid(isInvalid) {
    if (!consentLabel) return;
    consentLabel.classList.toggle("is-invalid", !!isInvalid);
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
    body.append("_subject", "DC Engineering — подписка на рассылку");
    body.append("Имя", data.name);
    body.append("Email", data.email);
    body.append("Страница", data.page);
    body.append("Источник", data.source);
    body.append("Согласие", data.consent);
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
    form.classList.add("is-done");
    if (nameInput) {
      nameInput.value = "";
    }
    if (emailInput) {
      emailInput.value = "";
    }
    if (consentInput) {
      consentInput.checked = false;
    }
    setConsentInvalid(false);
    setStatus("success", "Спасибо! Подписка оформлена.");
  }

  if (consentInput) {
    consentInput.addEventListener("change", function () {
      if (consentInput.checked) setConsentInvalid(false);
    });
  }

  form.querySelectorAll(".footer-newsletter__consent-text a").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("", "");
    setConsentInvalid(false);

    var name = (nameInput && nameInput.value ? nameInput.value : "").trim();
    var email = (emailInput && emailInput.value ? emailInput.value : "").trim();
    var honey = form.querySelector('input[name="website"]');

    if (honey && honey.value) return;

    if (!name) {
      setStatus("error", "Укажите имя.");
      if (nameInput) nameInput.focus();
      return;
    }

    if (!email) {
      setStatus("error", "Укажите email.");
      if (emailInput) emailInput.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error", "Проверьте формат email.");
      if (emailInput) emailInput.focus();
      return;
    }

    if (!consentInput || !consentInput.checked) {
      setConsentInvalid(true);
      setStatus("error", "Нужно согласие на обработку персональных данных.");
      if (consentInput) consentInput.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    setStatus("pending", "Отправляем…");

    var data = {
      name: name,
      email: email,
      page: window.location.href,
      source: "Футер — подписка на рассылку",
      consent: "yes",
    };

    var payload = new FormData();
    Object.keys(data).forEach(function (key) {
      payload.append(key, data[key]);
    });

    var send = STATIC_HOST ? sendViaFormsubmit(data) : sendViaPhp(payload);

    send
      .then(function () {
        showDone();
      })
      .catch(function () {
        setStatus("error", "Не удалось оформить подписку. Напишите на info@dce.su.");
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  });

  if (POLICY_HREF) {
    var policyLink = form.querySelector('.footer-newsletter__consent-text a[href="#"]');
    if (policyLink) {
      policyLink.setAttribute("href", POLICY_HREF);
    }
  }
})();
