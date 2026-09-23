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

  function ensureTintShims() {
    if (!document.body) return null;
    /* Bottom shim is what Safari 26 samples into a solid toolbar rectangle.
       Leave the bottom edge unpainted so the bar stays Liquid Glass. */
    var bottom = document.getElementById("dc-safari-tint-bottom");
    if (bottom && bottom.parentNode) bottom.parentNode.removeChild(bottom);
    var top = document.getElementById("dc-safari-tint-top");
    if (!top) {
      top = document.createElement("div");
      top.id = "dc-safari-tint-top";
      top.className = "dc-safari-tint dc-safari-tint--top";
      top.setAttribute("aria-hidden", "true");
      document.body.appendChild(top);
    }
    return { top: top };
  }

  function paintTintShim(el, color) {
    if (!el) return;
    el.style.backgroundColor = color;
    /* Do not move the node. A geometry change makes Safari 26 resample the
       bottom edge and paint a solid toolbar for a second or two. */
  }

  function syncSafariChrome(theme) {
    var pageColor = themeColorFor(theme);
    var subnav = document.querySelector("[data-section-subnav]");
    var header = document.querySelector(".site-header");

    root.style.setProperty("--safari-chrome-bg", pageColor);
    /* Inline colors override --bg and Safari treats that write as a new
       solid sample. Let the stylesheet variable follow data-theme instead. */
    root.style.removeProperty("background-color");
    if (document.body) document.body.style.removeProperty("background-color");
    if (header) {
      header.style.removeProperty("background-color");
      header.style.background = "none";
    }
    if (subnav) subnav.style.removeProperty("background-color");

    if (isMobile()) {
      var shims = ensureTintShims();
      if (shims) paintTintShim(shims.top, pageColor);
    }
  }

  var lastThemeColor = null;

  function pokeThemeColorMeta(color) {
    var nodes = document.querySelectorAll('meta[name="theme-color"]');
    var primary = null;
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (!nodes[i].hasAttribute("media")) {
        primary = nodes[i];
        break;
      }
    }
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i] !== primary) {
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
    if (!primary) {
      primary = document.createElement("meta");
      primary.setAttribute("name", "theme-color");
      document.head.appendChild(primary);
    } else {
      primary.removeAttribute("media");
    }
    /* Safari iOS: media-query theme-color follows OS, not the site toggle.
       A single tag + content nudge is what actually repaints top/bottom chrome. */
    var changed = lastThemeColor !== color;
    lastThemeColor = color;
    if (!changed) {
      primary.setAttribute("content", color);
      return;
    }
    primary.setAttribute("content", color === THEME_COLOR_DARK ? "#0b0f15" : "#f3f5f9");
    window.requestAnimationFrame(function () {
      primary.setAttribute("content", color);
    });
  }

  function syncThemeColor(theme) {
    var color = themeColorFor(theme);
    if (isMobile()) {
      /* theme-color is what paints Safari's bottom bar as a solid rectangle.
         Drop it so the toolbar stays Liquid Glass across the theme switch. */
      clearMetas("theme-color");
      setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    } else {
      pokeThemeColorMeta(color);
      setMeta(
        "apple-mobile-web-app-status-bar-style",
        color === THEME_COLOR_DARK ? "black-translucent" : "default"
      );
    }
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    syncSafariChrome(theme);
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
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

    /* Safari chrome sits outside the VT snapshot — paint it before the animation. */
    syncThemeColor(nextTheme);

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
        syncThemeColor(nextTheme);
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
