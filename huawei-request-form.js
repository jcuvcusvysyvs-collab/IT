(function () {
  var form = document.getElementById("huawei-request-form");
  var statusEl = document.getElementById("huawei-request-form-status");
  if (!form || !statusEl) return;

  var messageField = document.getElementById("huawei-request-message");
  var typeInputs = form.querySelectorAll('input[name="request_type"]');
  var feedbackSection = document.getElementById("huawei-feedback");

  var messagePlaceholders = {
    consultation: "Ваш вопрос",
    pricelist: "Комментарий (необязательно)",
  };

  var validTypes = { consultation: true, pricelist: true };

  function applyRequestType() {
    var selected = form.querySelector('input[name="request_type"]:checked');
    var type = selected ? selected.value : "pricelist";
    var isPricelist = type === "pricelist";

    if (messageField) {
      messageField.placeholder = messagePlaceholders[type] || messagePlaceholders.consultation;
      messageField.required = !isPricelist;
      messageField.setAttribute("aria-label", isPricelist ? "Комментарий" : "Ваш вопрос");
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
    applyRequestType();

    if (submitBtn) {
      window.setTimeout(function () {
        submitBtn.disabled = false;
      }, 1200);
    }
  });
})();
