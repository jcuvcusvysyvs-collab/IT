(function () {
  "use strict";

  var MASKS = {
    ru: {
      maxDigits: 10,
      groups: [3, 3, 2, 2],
      placeholder: "(___) ___ - __ - __",
    },
    by: {
      maxDigits: 9,
      groups: [2, 3, 2, 2],
      placeholder: "(__) ___ - __ - __",
    },
    kz: {
      maxDigits: 10,
      groups: [3, 3, 2, 2],
      placeholder: "(___) ___ - __ - __",
    },
  };

  var fields = document.querySelectorAll("[data-phone-country]");
  if (!fields.length) return;

  function extractDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function getMask(country) {
    return MASKS[country] || MASKS.ru;
  }

  function formatDigits(digits, groups) {
    var maxDigits = groups.reduce(function (sum, size) {
      return sum + size;
    }, 0);

    digits = digits.slice(0, maxDigits);
    if (!digits.length) return "";

    var first = digits.slice(0, groups[0]);
    var result = "(" + first;
    var pos = first.length;

    if (pos < groups[0]) return result;

    result += ")";
    var groupIndex = 1;

    while (groupIndex < groups.length && pos < digits.length) {
      var chunk = digits.slice(pos, pos + groups[groupIndex]);
      result += groupIndex === 1 ? " " : " - ";
      result += chunk;
      pos += chunk.length;

      if (chunk.length < groups[groupIndex]) break;
      groupIndex += 1;
    }

    return result;
  }

  function countDigitsBefore(value, caret) {
    var count = 0;

    for (var i = 0; i < caret && i < value.length; i += 1) {
      if (/\d/.test(value.charAt(i))) count += 1;
    }

    return count;
  }

  function caretForDigitIndex(formatted, digitIndex) {
    if (digitIndex <= 0) {
      var openParen = formatted.indexOf("(");
      return openParen >= 0 ? openParen + 1 : 0;
    }

    var seen = 0;

    for (var i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted.charAt(i))) {
        seen += 1;
        if (seen === digitIndex) return i + 1;
      }
    }

    return formatted.length;
  }

  function applyMask(input, country, caret) {
    var mask = getMask(country);
    var digits = extractDigits(input.value).slice(0, mask.maxDigits);
    var formatted = formatDigits(digits, mask.groups);
    var digitCaret = typeof caret === "number" ? countDigitsBefore(input.value, caret) : digits.length;

    input.value = formatted;
    input.dataset.digits = digits;

    var nextCaret = caretForDigitIndex(formatted, Math.min(digitCaret, digits.length));
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(nextCaret, nextCaret);
    }
  }

  fields.forEach(function (field) {
    var trigger = field.querySelector(".infra-phone-field__trigger");
    var dropdown = field.querySelector(".infra-phone-field__dropdown");
    var codeEl = field.querySelector(".infra-phone-field__number .infra-phone-field__code");
    var flagImg = field.querySelector(".infra-phone-field__flag img");
    var phoneInput = field.querySelector(".infra-phone-field__input");
    var countryInput = field.querySelector('input[name="phone_country"]');
    var options = field.querySelectorAll(".infra-phone-field__option");

    if (!trigger || !dropdown || !codeEl || !flagImg || !phoneInput) return;

    function currentCountry() {
      return (countryInput && countryInput.value) || "ru";
    }

    function closeDropdown() {
      dropdown.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }

    function openDropdown() {
      dropdown.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }

    function selectOption(option, keepDigits) {
      var country = option.dataset.country || "ru";
      var mask = getMask(country);

      options.forEach(function (item) {
        var selected = item === option;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-selected", selected ? "true" : "false");
      });

      codeEl.textContent = option.dataset.code || "+7";
      flagImg.src = option.dataset.flag || "images/form/Flag1.svg";
      phoneInput.placeholder = mask.placeholder;
      if (countryInput) countryInput.value = country;

      if (keepDigits && phoneInput.value) {
        applyMask(phoneInput, country);
      } else if (!keepDigits) {
        phoneInput.value = "";
        phoneInput.dataset.digits = "";
      }

      closeDropdown();
      phoneInput.focus();
    }

    phoneInput.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      var allowed = [
        "Backspace",
        "Delete",
        "Tab",
        "Enter",
        "Escape",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      if (allowed.indexOf(event.key) >= 0) return;
      if (/^\d$/.test(event.key)) return;

      event.preventDefault();
    });

    phoneInput.addEventListener("input", function () {
      applyMask(phoneInput, currentCountry(), phoneInput.selectionStart);
    });

    phoneInput.addEventListener("paste", function (event) {
      event.preventDefault();
      var pasted = (event.clipboardData || window.clipboardData).getData("text");
      var mask = getMask(currentCountry());
      var digits = extractDigits(phoneInput.value + pasted).slice(0, mask.maxDigits);

      phoneInput.value = digits;
      applyMask(phoneInput, currentCountry(), phoneInput.value.length);
    });

    phoneInput.addEventListener("blur", function () {
      applyMask(phoneInput, currentCountry());
    });

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (dropdown.hidden) openDropdown();
      else closeDropdown();
    });

    options.forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        selectOption(option, true);
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
        var defaultOption = field.querySelector('.infra-phone-field__option[data-country="ru"]');
        if (defaultOption) selectOption(defaultOption, false);
        else closeDropdown();
      });

      form.addEventListener("submit", function () {
        var country = currentCountry();
        var mask = getMask(country);
        var digits = extractDigits(phoneInput.value).slice(0, mask.maxDigits);
        phoneInput.dataset.digits = digits;
      });
    }

    var initialOption =
      field.querySelector('.infra-phone-field__option[data-country="' + currentCountry() + '"]') ||
      field.querySelector(".infra-phone-field__option.is-selected");

    if (initialOption) {
      codeEl.textContent = initialOption.dataset.code || "+7";
      flagImg.src = initialOption.dataset.flag || "images/form/Flag1.svg";
      phoneInput.placeholder = getMask(currentCountry()).placeholder;
    }
  });
})();
