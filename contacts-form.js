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
  bindForm("scaling-form", "scaling-form-status");
  bindForm("continuity-form", "continuity-form-status");
  bindForm("ops-form", "ops-form-status");
  bindForm("asdu-form", "asdu-form-status");
  preventConsentTextSelection();
})();
