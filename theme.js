(function () {
  var STORAGE_DESKTOP = "dc-site-theme";
  var STORAGE_MOBILE = "dc-site-theme-mobile";
  var root = document.documentElement;
  var mobileMq = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
  var colorMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function isMobile() {
    return !!(mobileMq && mobileMq.matches);
  }

  function storageKey() {
    return isMobile() ? STORAGE_MOBILE : STORAGE_DESKTOP;
  }

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(storageKey());
      return value === "dark" || value === "light" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      if (value === "dark" || value === "light") {
        localStorage.setItem(storageKey(), value);
      } else {
        localStorage.removeItem(storageKey());
      }
    } catch (e) {
      /* ignore */
    }
  }

  function systemTheme() {
    return colorMq && colorMq.matches ? "dark" : "light";
  }

  function resolveTheme() {
    return getStoredTheme() || systemTheme();
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function syncToggle(theme) {
    var inputs = document.querySelectorAll(".theme-switch-input");
    var dark = theme === "dark";
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].checked = dark;
      inputs[i].setAttribute("aria-checked", dark ? "true" : "false");
    }
  }

  function applyResolved() {
    var theme = resolveTheme();
    applyTheme(theme);
    syncToggle(theme);
    return theme;
  }

  applyResolved();

  function onSystemChange() {
    if (getStoredTheme()) return;
    applyResolved();
  }

  if (colorMq) {
    if (colorMq.addEventListener) {
      colorMq.addEventListener("change", onSystemChange);
    } else if (colorMq.addListener) {
      colorMq.addListener(onSystemChange);
    }
  }

  function onViewportChange() {
    applyResolved();
  }

  if (mobileMq) {
    if (mobileMq.addEventListener) {
      mobileMq.addEventListener("change", onViewportChange);
    } else if (mobileMq.addListener) {
      mobileMq.addListener(onViewportChange);
    }
  }

  function initToggle() {
    var inputs = document.querySelectorAll(".theme-switch-input");
    if (!inputs.length) return;

    syncToggle(resolveTheme());

    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("change", function () {
        var next = this.checked ? "dark" : "light";
        if (next === systemTheme()) {
          setStoredTheme(null);
        } else {
          setStoredTheme(next);
        }
        applyTheme(next);
        syncToggle(next);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle);
  } else {
    initToggle();
  }
})();
