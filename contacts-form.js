(function () {
  function bindForm(formId, statusId) {
    var form = document.getElementById(formId);
    var statusEl = document.getElementById(statusId);
    if (!form || !statusEl) return;

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

      if (submitBtn) {
        window.setTimeout(function () {
          submitBtn.disabled = false;
        }, 1200);
      }
    });
  }

  bindForm("contacts-form", "contacts-form-status");
  bindForm("infra-form", "infra-form-status");
  bindForm("infosec-form", "infosec-form-status");
})();
