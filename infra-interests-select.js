(function () {
  "use strict";

  var fields = document.querySelectorAll("[data-interests-select]");
  if (!fields.length) return;

  var PLACEHOLDER = "Выберите направления";

  fields.forEach(function (field) {
    var trigger = field.querySelector(".infra-interests-field__trigger");
    var dropdown = field.querySelector(".infra-interests-field__dropdown");
    var valueEl = field.querySelector(".infra-interests-field__value");
    var checkboxes = field.querySelectorAll(".infra-interests-field__checkbox");
    var options = field.querySelectorAll(".infra-interests-field__option");

    if (!trigger || !dropdown || !valueEl || !checkboxes.length) return;

    var formField = field.closest(".infra-form-field--interests");

    function closeDropdown() {
      dropdown.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      field.classList.remove("is-dropdown-open");
      if (formField) formField.classList.remove("is-dropdown-open");
    }

    function openDropdown() {
      dropdown.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      field.classList.add("is-dropdown-open");
      if (formField) formField.classList.add("is-dropdown-open");
    }

    function selectedLabels() {
      var labels = [];

      checkboxes.forEach(function (checkbox) {
        if (!checkbox.checked) return;
        var textEl = checkbox.closest(".infra-interests-field__option-label");
        var label = textEl && textEl.querySelector(".infra-interests-field__option-text");
        if (label) labels.push(label.textContent.trim());
      });

      return labels;
    }

    function updateValue() {
      var labels = selectedLabels();

      if (!labels.length) {
        valueEl.textContent = PLACEHOLDER;
        valueEl.classList.remove("has-value");
        return;
      }

      valueEl.textContent = labels.join(", ");
      valueEl.classList.add("has-value");
    }

    function syncOptionState() {
      options.forEach(function (option) {
        var checkbox = option.querySelector(".infra-interests-field__checkbox");
        if (!checkbox) return;
        option.classList.toggle("is-selected", checkbox.checked);
        option.setAttribute("aria-selected", checkbox.checked ? "true" : "false");
      });
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (dropdown.hidden) openDropdown();
      else closeDropdown();
    });

    checkboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        syncOptionState();
        updateValue();
      });
    });

    field.querySelectorAll(".infra-interests-field__option-label").forEach(function (label) {
      label.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    });

    document.addEventListener("click", function (event) {
      if (!field.contains(event.target)) closeDropdown();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDropdown();
    });

    var form = field.closest("form");
    if (form) {
      form.addEventListener("reset", function () {
        checkboxes.forEach(function (checkbox) {
          checkbox.checked = false;
        });
        syncOptionState();
        updateValue();
        closeDropdown();
      });
    }

    syncOptionState();
    updateValue();
  });
})();
