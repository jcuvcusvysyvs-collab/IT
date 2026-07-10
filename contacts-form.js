(function () {
  var form = document.getElementById("contacts-form");
  var statusEl = document.getElementById("contacts-form-status");
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
})();
