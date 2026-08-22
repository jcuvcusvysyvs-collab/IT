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

  var MAIL_ENDPOINT = "send-form.php";
  var TEST_MAIL_FALLBACK = "https://formsubmit.co/ajax/obrainov@yandex.ru";

  function setStatus(statusEl, type, text) {
    statusEl.textContent = text;
    statusEl.className = "huawei-request-form__status is-" + type;
  }

  function interestLabel(input) {
    var text = input.closest("label") && input.closest("label").querySelector(".infra-interests-field__option-text");
    return text ? text.textContent.trim() : input.value;
  }

  function buildPayload(form) {
    var payload = new FormData(form);
    var labels = [];
    form.querySelectorAll('input[name="interests[]"]:checked').forEach(function (input) {
      labels.push(interestLabel(input));
    });
    payload.delete("interests[]");
    labels.forEach(function (label) {
      payload.append("interests[]", label);
    });
    payload.set("page", window.location.href);
    payload.set("source", document.title || "Сайт DC Engineering");
    return payload;
  }

  function payloadToJson(payload) {
    var data = {};
    payload.forEach(function (value, key) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    return data;
  }

  function sendViaPhp(payload) {
    return fetch(MAIL_ENDPOINT, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    }).then(function (response) {
      if (response.status === 404) {
        var err = new Error("php-missing");
        err.code = "php-missing";
        throw err;
      }
      return response.json().then(function (data) {
        if (!response.ok || !data || !data.ok) {
          throw new Error("mail");
        }
        return data;
      });
    });
  }

  function sendViaFormsubmit(payload) {
    var data = payloadToJson(payload);
    data._subject = "Заявка с сайта: Инфраструктурные решения";
    data._template = "table";
    data._captcha = "false";
    return fetch(TEST_MAIL_FALLBACK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    }).then(function (response) {
      return response.json().then(function (result) {
        if (!response.ok || (result && result.success === false)) {
          throw new Error("mail");
        }
        return result;
      });
    });
  }

  function sendMail(form) {
    var payload = buildPayload(form);
    return sendViaPhp(payload).catch(function (error) {
      if (error && error.code === "php-missing") {
        return sendViaFormsubmit(payload);
      }
      throw error;
    });
  }

  function bindForm(formId, statusId, options) {
    var form = document.getElementById(formId);
    var statusEl = document.getElementById(statusId);
    if (!form || !statusEl) return;
    options = options || {};

    form.addEventListener("submit", function (event) {
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

      sendMail(form)
        .then(function () {
          setStatus(
            statusEl,
            "success",
            "Спасибо! Заявка отправлена — письмо придёт на тестовую почту."
          );
          form.reset();
          var interestsValue = document.getElementById("infra-interests-value");
          if (interestsValue) interestsValue.textContent = "Выберите направления";
        })
        .catch(function () {
          setStatus(
            statusEl,
            "error",
            "Не удалось отправить заявку. Попробуйте ещё раз или напишите на obrainov@yandex.ru."
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
