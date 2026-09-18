(function () {
  var STORAGE_DESKTOP = "dc-site-theme";
  var STORAGE_MOBILE = "dc-site-theme-mobile";
  var root = document.documentElement;
  var mobileMq = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
  var colorMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var reduceMq = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  var THEME_COLOR_LIGHT = "#f4f6fa";
  var THEME_COLOR_DARK = "#0a0e14";
  var TRANSITION_MS = 560;
  var DEFAULT_VARIANT = "circle"; /* "circle" | "triangle" | "fade" */

  var lastPointer = { x: null, y: null };
  var themeTransitionBusy = false;

  function isMobile() {
    return !!(mobileMq && mobileMq.matches);
  }

  function prefersReducedMotion() {
    return !!(reduceMq && reduceMq.matches);
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

  function themeColorFor(theme) {
    return theme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  }

  function getTransitionVariant() {
    var fromRoot = root.getAttribute("data-theme-transition");
    if (fromRoot === "circle" || fromRoot === "triangle" || fromRoot === "fade") {
      return fromRoot;
    }
    var switchEl = document.querySelector(".theme-switch[data-variant]");
    if (switchEl) {
      var fromSwitch = switchEl.getAttribute("data-variant");
      if (fromSwitch === "circle" || fromSwitch === "triangle" || fromSwitch === "fade") {
        return fromSwitch;
      }
    }
    return DEFAULT_VARIANT;
  }

  function clearMetas(name) {
    var existing = document.querySelectorAll('meta[name="' + name + '"]');
    for (var i = 0; i < existing.length; i++) {
      existing[i].parentNode.removeChild(existing[i]);
    }
  }

  function appendMeta(name, content, media) {
    var meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    if (media) meta.setAttribute("media", media);
    document.head.appendChild(meta);
  }

  function setMeta(name, content) {
    clearMetas(name);
    appendMeta(name, content);
  }

  function syncSafariChrome(theme) {
    var pageColor = themeColorFor(theme);
    var subnav = document.querySelector("[data-section-subnav]");
    var header = document.querySelector(".site-header");
    var scrollY = window.scrollY || window.pageYOffset || 0;
    if (scrollY < 0) scrollY = 0;
    var subnavStuck = !!(subnav && subnav.classList.contains("is-stuck") && scrollY > 2);
    var headerHidden = !!(header && header.classList.contains("site-header--hidden"));
    var subnavAtTop =
      !!(
        subnav &&
        scrollY > 2 &&
        subnav.getBoundingClientRect &&
        subnav.getBoundingClientRect().top <= 1
      );
    var chromeColor = pageColor;

    /* Dark full-bleed hero: light theme → dark Safari chrome until subnav is sticky (same as infra). */
    if (theme === "light" && subnav && !subnavStuck) {
      chromeColor = THEME_COLOR_DARK;
    }

    root.style.setProperty("--safari-chrome-bg", chromeColor);
    /* Over dark hero: html matches chrome (Safari overscroll top/bottom). */
    root.style.backgroundColor = chromeColor;
    if (chromeColor === THEME_COLOR_DARK) {
      root.setAttribute("data-safari-chrome", "dark");
    } else {
      root.removeAttribute("data-safari-chrome");
    }

    if (document.body) {
      document.body.style.backgroundColor = pageColor;
    }

    if (!isMobile()) {
      if (header) header.style.removeProperty("background-color");
      if (subnav) subnav.style.removeProperty("background-color");
      return;
    }

    if (header) {
      if (!subnavStuck && !subnavAtTop && !headerHidden) {
        header.style.backgroundColor = chromeColor;
      } else {
        header.style.removeProperty("background-color");
      }
    }

    if (subnav) {
      if (subnavStuck || subnavAtTop) {
        subnav.style.backgroundColor = pageColor;
      } else if (theme === "light") {
        subnav.style.backgroundColor = THEME_COLOR_DARK;
      } else {
        subnav.style.removeProperty("background-color");
      }
    }
  }

  function syncThemeColor(theme) {
    var color = themeColorFor(theme);
    syncSafariChrome(theme);
    var chrome =
      (root.style.getPropertyValue("--safari-chrome-bg") || "").trim() || color;
    clearMetas("theme-color");
    appendMeta("theme-color", chrome);
    appendMeta("theme-color", chrome, "(prefers-color-scheme: light)");
    appendMeta("theme-color", chrome, "(prefers-color-scheme: dark)");
    setMeta(
      "apple-mobile-web-app-status-bar-style",
      chrome === THEME_COLOR_DARK ? "black-translucent" : "default"
    );
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    syncThemeColor(theme);
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

  function resolvePointer(event, switchEl) {
    if (event && typeof event.clientX === "number" && event.clientX > 0) {
      return { x: event.clientX, y: event.clientY };
    }
    if (lastPointer.x != null && lastPointer.y != null) {
      return { x: lastPointer.x, y: lastPointer.y };
    }
    if (switchEl && switchEl.getBoundingClientRect) {
      var rect = switchEl.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }

  function maxRadiusFromPoint(x, y) {
    return Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
  }

  function buildKeyframe(variant, x, y, endRadius) {
    if (variant === "fade") {
      return {
        from: { opacity: 0 },
        to: { opacity: 1 },
      };
    }

    if (variant === "triangle") {
      var r = endRadius * 1.15;
      var x1 = x;
      var y1 = y - r;
      var x2 = x + r * 0.866;
      var y2 = y + r * 0.5;
      var x3 = x - r * 0.866;
      var y3 = y + r * 0.5;
      return {
        from: {
          clipPath:
            "polygon(" + x + "px " + y + "px, " + x + "px " + y + "px, " + x + "px " + y + "px)",
        },
        to: {
          clipPath:
            "polygon(" +
            x1 +
            "px " +
            y1 +
            "px, " +
            x2 +
            "px " +
            y2 +
            "px, " +
            x3 +
            "px " +
            y3 +
            "px)",
        },
      };
    }

    /* circle — по умолчанию */
    return {
      from: { clipPath: "circle(0px at " + x + "px " + y + "px)" },
      to: { clipPath: "circle(" + endRadius + "px at " + x + "px " + y + "px)" },
    };
  }

  function runThemeTransition(nextTheme, event, switchEl) {
    var variant = getTransitionVariant();
    root.setAttribute("data-theme-transition", variant);

    if (
      prefersReducedMotion() ||
      typeof document.startViewTransition !== "function"
    ) {
      applyTheme(nextTheme);
      syncToggle(nextTheme);
      return;
    }

    var point = resolvePointer(event, switchEl);
    var x = point.x;
    var y = point.y;
    var endRadius = maxRadiusFromPoint(x, y);
    var keyframes = buildKeyframe(variant, x, y, endRadius);

    themeTransitionBusy = true;
    root.classList.add("theme-vt-active");

    function startVt() {
      var transition = document.startViewTransition(function () {
        applyTheme(nextTheme);
        syncToggle(nextTheme);
      });

      transition.ready
        .then(function () {
          document.documentElement.animate([keyframes.from, keyframes.to], {
            duration: TRANSITION_MS,
            easing: "cubic-bezier(0.32, 0.72, 0, 1)",
            fill: "both",
            pseudoElement: "::view-transition-new(root)",
          });
        })
        .catch(function () {
          /* ignore */
        });

      function cleanup() {
        themeTransitionBusy = false;
        root.classList.remove("theme-vt-active");
      }

      if (transition.finished && typeof transition.finished.then === "function") {
        transition.finished.then(cleanup).catch(cleanup);
      } else {
        window.setTimeout(cleanup, TRANSITION_MS + 80);
      }
    }

    /* 2× rAF: pause маркью успевает примениться до снимка VT */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(startVt);
    });
  }

  applyResolved();

  window.dcSiteTheme = {
    refreshThemeColor: function () {
      syncThemeColor(currentTheme());
    },
    syncThemeColor: syncThemeColor,
    setTransitionVariant: function (variant) {
      if (variant === "circle" || variant === "triangle" || variant === "fade") {
        root.setAttribute("data-theme-transition", variant);
      }
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

  document.addEventListener(
    "pointerdown",
    function (e) {
      var switchEl = e.target && e.target.closest && e.target.closest(".theme-switch");
      if (!switchEl) return;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    true
  );

  function initToggle() {
    var inputs = document.querySelectorAll(".theme-switch-input");
    if (!inputs.length) return;

    if (!root.getAttribute("data-theme-transition")) {
      root.setAttribute("data-theme-transition", DEFAULT_VARIANT);
    }

    syncToggle(resolveTheme());

    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("change", function (e) {
        var next = this.checked ? "dark" : "light";
        if (next === currentTheme() && !themeTransitionBusy) {
          syncToggle(next);
          return;
        }

        if (next === systemTheme()) {
          setStoredTheme(null);
        } else {
          setStoredTheme(next);
        }

        var switchEl =
          (this.closest && this.closest(".theme-switch")) ||
          document.querySelector(".theme-switch");

        runThemeTransition(next, e, switchEl);
      });
    }
  }

  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(function () {
      syncThemeColor(currentTheme());
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle);
  } else {
    initToggle();
  }
})();
