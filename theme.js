(function () {
  var STORAGE_DESKTOP = "dc-site-theme";
  var STORAGE_MOBILE = "dc-site-theme-mobile";
  var root = document.documentElement;
  var mobileMq = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
  var colorMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  var THEME_COLOR_LIGHT = "#f4f6fa";
  var THEME_COLOR_DARK = "#0a0e14";

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

  function currentTheme() {
    return root.hasAttribute("data-theme") ? "dark" : "light";
  }

  function resolveThemeColor(theme) {
    if (theme === "dark") {
      return THEME_COLOR_DARK;
    }

    var subnav = document.querySelector("[data-section-subnav]");
    if (
      subnav &&
      document.body &&
      !document.body.classList.contains("page-about") &&
      !subnav.classList.contains("is-stuck")
    ) {
      return THEME_COLOR_DARK;
    }

    return THEME_COLOR_LIGHT;
  }

  function syncThemeColor(theme, options) {
    options = options || {};
    var color = options.forceThemeMatch
      ? theme === "dark"
        ? THEME_COLOR_DARK
        : THEME_COLOR_LIGHT
      : resolveThemeColor(theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    if (meta.getAttribute("content") !== color) {
      meta.setAttribute("content", color);
    }

    var appleBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleBar) {
      appleBar = document.createElement("meta");
      appleBar.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(appleBar);
    }
    var appleStyle = color === THEME_COLOR_DARK ? "black-translucent" : "default";
    if (appleBar.getAttribute("content") !== appleStyle) {
      appleBar.setAttribute("content", appleStyle);
    }
  }

  function applyTheme(theme, options) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    syncThemeColor(theme, options);
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

  window.dcSiteTheme = {
    refreshThemeColor: function () {
      syncThemeColor(currentTheme());
    },
  };

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
        applyTheme(next, { forceThemeMatch: true });
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
