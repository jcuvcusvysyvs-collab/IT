(function () {
  var STORAGE_KEY = "dc-site-theme";
  var root = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function resolveInitialTheme() {
    var stored = getStoredTheme();
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  var initial = resolveInitialTheme();
  applyTheme(initial);

  function initToggle() {
    var input = document.querySelector(".theme-switch-input");
    if (!input) return;

    input.checked = initial === "dark";
    input.setAttribute("aria-checked", input.checked ? "true" : "false");

    input.addEventListener("change", function () {
      var dark = input.checked;
      applyTheme(dark ? "dark" : "light");
      setStoredTheme(dark ? "dark" : "light");
      input.setAttribute("aria-checked", dark ? "true" : "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle);
  } else {
    initToggle();
  }
})();
