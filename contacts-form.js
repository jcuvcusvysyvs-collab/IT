(function () {
  function preventConsentTextSelection() {
    document.querySelectorAll(".huawei-request-form__consent").forEach(function (label) {
      var touchStartX = 0;
      var touchStartY = 0;

      label.addEventListener("selectstart", function (event) {
        event.preventDefault();
      });

      label.addEventListener(
        "touchstart",
        function (event) {
          if (!event.touches || !event.touches.length) return;
          touchStartX = event.touches[0].clientX;
          touchStartY = event.touches[0].clientY;
        },
        { passive: true }
      );

      label.addEventListener(
        "touchend",
        function (event) {
          if (!event.changedTouches || !event.changedTouches.length) return;

          var dx = Math.abs(event.changedTouches[0].clientX - touchStartX);
          var dy = Math.abs(event.changedTouches[0].clientY - touchStartY);
          if (dx > 10 || dy > 10) return;

          var selection = window.getSelection && window.getSelection();
          if (selection && selection.removeAllRanges) {
            requestAnimationFrame(function () {
              selection.removeAllRanges();
            });
          }
        },
        { passive: true }
      );
    });
  }

  function setStatus(statusEl, type, text) {
    statusEl.textContent = text;
    statusEl.className = "huawei-request-form__status is-" + type;
  }

  function interestLabel(input) {
    var text = input.closest("label") && input.closest("label").querySelector(".infra-interests-field__option-text");
    return text ? text.textContent.trim() : input.value;
  }

  function phoneValue(form) {
    var code = form.querySelector(".infra-phone-field__code");
    var phone = form.querySelector('input[name="phone"]');
    var country = form.querySelector('input[name="phone_country"]');
    var parts = [];
    if (code && code.textContent) parts.push(code.textContent.trim());
    if (phone && phone.value) parts.push(phone.value.trim());
    var result = parts.join(" ");
    if (country && country.value) result += " (" + country.value + ")";
    return result.trim();
  }

  function buildMailData(form) {
    var interests = [];
    form.querySelectorAll('input[name="interests[]"]:checked').forEach(function (input) {
      interests.push(interestLabel(input));
    });

    return {
      name: (form.elements.name && form.elements.name.value) || "",
      company: (form.elements.company && form.elements.company.value) || "",
      email: (form.elements.email && form.elements.email.value) || "",
      phone: phoneValue(form),
      interests: interests.length ? interests.join(", ") : "—",
      message: (form.elements.message && form.elements.message.value) || "",
      page: window.location.href,
      source: "Инфраструктурные решения",
    };
  }

  var TEST_INBOX = "kislinskiy.stas00@mail.ru";
  var STATIC_HOST = /github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) || location.protocol === "file:";

  function ensureHidden(form, name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  function submitViaFormsubmit(form) {
    var data = buildMailData(form);
    ensureHidden(form, "_captcha", "false");
    ensureHidden(form, "_template", "table");
    ensureHidden(form, "_subject", "Заявка с сайта: Инфраструктурные решения");
    ensureHidden(form, "_next", location.href.split("#")[0].replace(/[?&]sent=1/, "") + (location.search ? "&" : "?") + "sent=1#infra-feedback");
    ensureHidden(form, "phone", data.phone);
    ensureHidden(form, "interests", data.interests);
    ensureHidden(form, "page", data.page);
    ensureHidden(form, "source", data.source);
    form.setAttribute("data-native-submit", "1");
    form.action = "https://formsubmit.co/" + encodeURIComponent(TEST_INBOX);
    form.method = "post";
    form.submit();
  }

  function parseJson(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function sendMail(form) {
    var payload = new FormData();
    var data = buildMailData(form);
    Object.keys(data).forEach(function (key) {
      payload.append(key, data[key]);
    });

    return fetch("send-form.php", {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    }).then(function (response) {
      return response.text().then(function (raw) {
        var result = parseJson(raw);
        if (result && result.ok) return result;

        var err = new Error("mail");
        if (result && result.error) {
          err.code = result.error;
        } else if (response.status === 404) {
          err.code = "php_missing";
        } else if (!result) {
          err.code = "php_not_running";
        } else {
          err.code = "mail";
        }
        throw err;
      });
    });
  }

  function bindForm(formId, statusId, options) {
    var form = document.getElementById(formId);
    var statusEl = document.getElementById(statusId);
    if (!form || !statusEl) return;
    options = options || {};

    if (/[?&]sent=1(?:&|$)/.test(location.search)) {
      setStatus(statusEl, "success", "Спасибо! Если это первая заявка, подтвердите адрес в письме на " + TEST_INBOX + " (проверьте «Спам»). Следующие заявки придут автоматически.");
    }

    form.addEventListener("submit", function (event) {
      if (form.getAttribute("data-native-submit") === "1") return;

      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var submitBtn = form.querySelector(".huawei-request-form__submit");
      if (submitBtn) submitBtn.disabled = true;
      setStatus(statusEl, "pending", "Отправляем заявку...");

      var done = function () {
        if (submitBtn) submitBtn.disabled = false;
      };

      if (!options.mail) {
        setStatus(
          statusEl,
          "success",
          "Спасибо! Заявка принята — мы свяжемся с вами в ближайшее время."
        );
        form.reset();
        window.setTimeout(done, 1200);
        return;
      }

      if (STATIC_HOST) {
        setStatus(statusEl, "pending", "Отправляем заявку на " + TEST_INBOX + "...");
        window.setTimeout(function () {
          submitViaFormsubmit(form);
        }, 200);
        return;
      }

      sendMail(form)
        .then(function () {
          setStatus(
            statusEl,
            "success",
            "Спасибо! Заявка отправлена на " + TEST_INBOX + "."
          );
          form.reset();
          var interestsValue = document.getElementById("infra-interests-value");
          if (interestsValue) interestsValue.textContent = "Выберите направления";
        })
        .catch(function (error) {
          var code = error && error.code;
          if (code === "php_missing" || code === "php_not_running" || code === "mail_disabled") {
            setStatus(statusEl, "pending", "Отправляем заявку на " + TEST_INBOX + "...");
            submitViaFormsubmit(form);
            return;
          }
          setStatus(
            statusEl,
            "error",
            "Не удалось отправить заявку" + (code ? " (" + code + ")" : "") + "."
          );
        })
        .then(done);
    });
  }

  bindForm("contacts-form", "contacts-form-status");
  bindForm("infra-form", "infra-form-status", { mail: true });
  bindForm("infosec-form", "infosec-form-status");
  bindForm("scaling-form", "scaling-form-status");
  bindForm("continuity-form", "continuity-form-status");
  bindForm("ops-form", "ops-form-status");
  bindForm("asdu-form", "asdu-form-status");
  preventConsentTextSelection();
})();
