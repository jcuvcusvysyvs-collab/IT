(function () {
  var form = document.getElementById("huawei-request-form");
  var statusEl = document.getElementById("huawei-request-form-status");
  if (!form || !statusEl) return;

  var messageField = document.getElementById("huawei-request-message");
  var typeInputs = form.querySelectorAll('input[name="request_type"]');
  var feedbackSection = document.getElementById("huawei-feedback");
  var MAIL_INBOX = "kislinskiy.stas00@mail.ru";
  var STATIC_HOST =
    /github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) ||
    location.protocol === "file:";

  var messagePlaceholders = {
    consultation: "Ваш вопрос",
    pricelist: "Комментарий (необязательно)",
  };

  var validTypes = { consultation: true, pricelist: true };
  var typeLabels = {
    consultation: "Консультация",
    pricelist: "Прейскурант",
  };

  function setStatus(type, text) {
    statusEl.textContent = text || "";
    statusEl.className = "huawei-request-form__status" + (type ? " is-" + type : "");
  }

  function applyRequestType() {
    var selected = form.querySelector('input[name="request_type"]:checked');
    var type = selected ? selected.value : "pricelist";
    var isPricelist = type === "pricelist";

    if (messageField) {
      messageField.placeholder = messagePlaceholders[type] || messagePlaceholders.consultation;
      messageField.required = !isPricelist;
      messageField.setAttribute("aria-label", isPricelist ? "Комментарий" : "Ваш вопрос");
      var label = messageField.closest("label");
      var labelText = label && label.querySelector(".infra-form-field__label");
      if (labelText) {
        labelText.textContent = isPricelist ? "Комментарий" : "Ваш вопрос";
      }
    }
  }

  function selectRequestType(type) {
    if (!validTypes[type]) return;
    var input = form.querySelector('input[name="request_type"][value="' + type + '"]');
    if (!input) return;
    input.checked = true;
    applyRequestType();
  }

  function scrollToFeedback() {
    if (!feedbackSection) return;

    var headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 72;
    var subnavH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--section-subnav-height")) || 76;
    var targetY = Math.max(
      0,
      Math.round(feedbackSection.getBoundingClientRect().top + window.scrollY - headerH - subnavH)
    );
    var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: targetY, behavior: smooth ? "smooth" : "auto" });
  }

  function openFeedback(type, options) {
    options = options || {};
    if (type) selectRequestType(type);
    if (options.scroll !== false) scrollToFeedback();
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#huawei-feedback");
    }
  }

  window.dceOpenHuaweiFeedback = openFeedback;

  typeInputs.forEach(function (input) {
    input.addEventListener("change", applyRequestType);
  });

  applyRequestType();

  if (window.location.hash === "#huawei-feedback") {
    openFeedback("pricelist");
  }

  document.querySelectorAll("[data-huawei-request-type]").forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      if (trigger.closest("[data-section-subnav]")) return;
      var type = trigger.getAttribute("data-huawei-request-type");
      if (!type || !validTypes[type]) return;
      event.preventDefault();
      openFeedback(type);
    });
  });

  function phoneValue() {
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

  function buildMailData() {
    var selected = form.querySelector('input[name="request_type"]:checked');
    var type = selected ? selected.value : "pricelist";
    var typeLabel = typeLabels[type] || type;
    var inn = (form.elements.inn && form.elements.inn.value) || "";

    return {
      name: (form.elements.name && form.elements.name.value) || "",
      company: inn ? "ИНН: " + inn : "",
      email: (form.elements.email && form.elements.email.value) || "",
      phone: phoneValue(),
      interests: typeLabel,
      message: (form.elements.message && form.elements.message.value) || "",
      page: window.location.href,
      source: "Huawei — " + typeLabel,
    };
  }

  function ensureHidden(name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  function clearFieldNames() {
    var keep = {
      _captcha: true,
      _template: true,
      _subject: true,
      _next: true,
      _replyto: true,
    };
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || keep[el.name]) return;
      el.removeAttribute("name");
    });
  }

  function submitViaFormsubmit() {
    var data = buildMailData();
    ensureHidden("_captcha", "false");
    ensureHidden("_template", "box");
    ensureHidden("_subject", "DC Engineering — заявка Huawei");
    ensureHidden("_replyto", data.email);
    ensureHidden(
      "_next",
      location.href.split("#")[0].replace(/[?&]sent=1/, "") +
        (location.search.indexOf("sent=1") === -1 ? (location.search ? "&" : "?") + "sent=1" : "") +
        "#huawei-feedback"
    );
    clearFieldNames();
    ensureHidden("Имя", data.name);
    ensureHidden("Email", data.email);
    ensureHidden("Телефон", data.phone || "—");
    ensureHidden("Тип", data.interests);
    ensureHidden("ИНН", data.company || "—");
    ensureHidden("Сообщение", data.message || "—");
    ensureHidden("Страница", data.page);
    form.setAttribute("data-native-submit", "1");
    form.action = "https://formsubmit.co/" + encodeURIComponent(MAIL_INBOX);
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

  function sendMail() {
    var payload = new FormData();
    var data = buildMailData();
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

  if (/[?&]sent=1(?:&|$)/.test(location.search)) {
    setStatus("success", "Спасибо! Заявка отправлена — мы свяжемся с вами в ближайшее время.");
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
    setStatus("pending", "Отправляем заявку...");

    var done = function () {
      if (submitBtn) submitBtn.disabled = false;
    };

    if (STATIC_HOST) {
      window.setTimeout(function () {
        submitViaFormsubmit();
      }, 200);
      return;
    }

    sendMail()
      .then(function () {
        setStatus("success", "Спасибо! Заявка отправлена — мы свяжемся с вами в ближайшее время.");
        form.reset();
        applyRequestType();
      })
      .catch(function (error) {
        var code = error && error.code;
        if (code === "php_missing" || code === "php_not_running" || code === "mail_disabled") {
          setStatus("pending", "Отправляем заявку...");
          submitViaFormsubmit();
          return;
        }
        setStatus("error", "Не удалось отправить заявку" + (code ? " (" + code + ")" : "") + ".");
      })
      .then(done);
  });
})();
