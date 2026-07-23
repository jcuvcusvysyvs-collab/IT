(function () {
  var form = document.getElementById("asdu-form");
  var statusEl = document.getElementById("asdu-form-status");
  if (!form || !statusEl) return;

  var messageField = document.getElementById("asdu-request-message");
  var submitText = form.querySelector("[data-asdu-submit-text]");
  var typeInputs = form.querySelectorAll('input[name="request_type"]');

  var byType = {
    consultation: {
      messagePlaceholder: "Кратко опишите задачу",
      messageRequired: true,
      submit: "Получить консультацию",
    },
    proposal: {
      messagePlaceholder: "Комментарий к запросу КП (необязательно)",
      messageRequired: false,
      submit: "Запросить КП",
    },
    pilot: {
      messagePlaceholder: "Какой сценарий хотите увидеть в пилоте (необязательно)",
      messageRequired: false,
      submit: "Запросить пилот",
    },
  };

  function selectRequestType(type) {
    if (!byType[type]) return;
    var input = form.querySelector('input[name="request_type"][value="' + type + '"]');
    if (!input) return;
    input.checked = true;
    applyRequestType();
  }

  function applyRequestType() {
    var selected = form.querySelector('input[name="request_type"]:checked');
    var type = selected ? selected.value : "consultation";
    var config = byType[type] || byType.consultation;

    if (messageField) {
      messageField.placeholder = config.messagePlaceholder;
      messageField.required = config.messageRequired;
      messageField.setAttribute("aria-label", config.messagePlaceholder);
    }

    if (submitText) {
      submitText.textContent = config.submit;
    }
  }

  typeInputs.forEach(function (input) {
    input.addEventListener("change", applyRequestType);
  });

  applyRequestType();

  document.querySelectorAll("[data-asdu-request-type]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var type = trigger.getAttribute("data-asdu-request-type");
      if (!type || !byType[type]) return;
      selectRequestType(type);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var submitBtn = form.querySelector(".huawei-request-form__submit");
    if (submitBtn) submitBtn.disabled = true;

    statusEl.textContent = "Спасибо! Заявка принята — мы свяжемся с вами в ближайшее время.";
    statusEl.className = "huawei-request-form__status is-success";
    form.reset();

    var consultation = form.querySelector('input[name="request_type"][value="consultation"]');
    if (consultation) consultation.checked = true;
    applyRequestType();

    if (submitBtn) {
      window.setTimeout(function () {
        submitBtn.disabled = false;
      }, 1200);
    }
  });
})();
