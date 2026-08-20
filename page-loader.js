(function () {
  "use strict";

  var THEME_KEY = "dc-site-theme";
  var html = document.documentElement;

  function applyThemeEarly() {
    if (html.getAttribute("data-404-lock-theme") === "1") return;
    try {
      var mobile = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
      var stored = localStorage.getItem(mobile ? "dc-site-theme-mobile" : THEME_KEY);
      if (stored === "dark") {
        html.setAttribute("data-theme", "dark");
      } else if (stored === "light") {
        html.removeAttribute("data-theme");
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.setAttribute("data-theme", "dark");
      } else {
        html.removeAttribute("data-theme");
      }
    } catch (e) {
      /* ignore */
    }
  }

  applyThemeEarly();

  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var force = /(?:\?|&)loader=1(?:&|$)/.test(location.search);

  var SESSION_KEY = "dce-loader-seen";
  var firstVisit = true;
  try {
    firstVisit = sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch (e) {
    firstVisit = true;
  }
  if (force) firstVisit = true;

  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch (e) {
    /* ignore */
  }

  html.classList.add("is-loading");
  html.setAttribute("aria-busy", "true");

  var critical = document.createElement("style");
  critical.id = "page-loader-critical";
  critical.textContent =
    "html.is-loading,html.is-loading body{overflow:hidden;height:100%;}" +
    ".page-loader{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;" +
    "background:rgba(244,246,250,.2);color:#0d1117;" +
    "-webkit-backdrop-filter:blur(24px) saturate(1.22);backdrop-filter:blur(24px) saturate(1.22);}" +
    'html[data-theme="dark"] .page-loader{background:rgba(10,14,20,.18);color:#eef2f8;}';
  (document.head || html).appendChild(critical);

  var overlay = null;
  var dismissed = false;
  var startedAt = Date.now();
  var pageReady = document.readyState !== "loading";
  var videoReady = !!(reduced && !force);
  /* Video-first: short brand beat, unlock as soon as hero video is primed */
  var MIN_MS = reduced && !force ? 420 : firstVisit ? 1100 : 720;
  var FADE_MS = reduced && !force ? 280 : firstVisit ? 420 : 320;
  var isDesktop =
    window.matchMedia && window.matchMedia("(min-width: 721px)").matches;
  /* Mobile needs longer buffer before unlock; don't force play on a single frame */
  var VIDEO_WAIT_MS = isDesktop ? 5500 : 7000;

  var MARKUP =
    '<span class="visually-hidden">Загрузка DC Engineering</span>' +
    '<div class="page-loader__stage">' +
    '<div class="page-loader__morph">' +
    '<svg class="page-loader__goo" aria-hidden="true" focusable="false">' +
    "<defs>" +
    '<filter id="dce-loader-goo" color-interpolation-filters="sRGB">' +
    '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" result="goo"/>' +
    '<feComposite in="SourceGraphic" in2="goo" operator="atop"/>' +
    "</filter>" +
    "</defs>" +
    "</svg>" +
    '<div class="page-loader__words">' +
    '<span class="page-loader__ghost" aria-hidden="true">ENGINEERING</span>' +
    '<span class="page-loader__word" aria-hidden="true">DATA</span>' +
    '<span class="page-loader__word" aria-hidden="true">CENTER</span>' +
    '<span class="page-loader__word" aria-hidden="true">ENGINEERING</span>' +
    "</div>" +
    "</div>" +
    "</div>";

  function mount() {
    if (overlay || dismissed) return;
    if (!document.body) {
      requestAnimationFrame(mount);
      return;
    }
    overlay = document.createElement("div");
    overlay.className =
      "page-loader" +
      (reduced && !force ? " page-loader--static" : "") +
      (!firstVisit ? " page-loader--fast" : "");
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", "Загрузка");
    overlay.innerHTML = MARKUP;
    document.body.insertBefore(overlay, document.body.firstChild);
  }

  mount();

  function notifyLoaderDone() {
    if (window.__dcePageLoaderDone) return;
    window.__dcePageLoaderDone = true;
    try {
      document.dispatchEvent(new CustomEvent("dce-page-loader-done"));
    } catch (e) {
      /* ignore */
    }
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    html.classList.remove("is-loading");
    html.removeAttribute("aria-busy");

    if (!overlay) {
      overlay = document.querySelector(".page-loader");
    }
    if (!overlay) {
      notifyLoaderDone();
      return;
    }

    overlay.classList.add("is-leaving");
    overlay.setAttribute("aria-hidden", "true");

    window.setTimeout(function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      if (critical && critical.parentNode) {
        critical.parentNode.removeChild(critical);
      }
      notifyLoaderDone();
    }, FADE_MS + 40);
  }

  function tryDismiss() {
    if (dismissed) return;
    if (!pageReady) return;
    if (!videoReady) return;
    var elapsed = Date.now() - startedAt;
    if (elapsed < MIN_MS) {
      window.setTimeout(tryDismiss, MIN_MS - elapsed);
      return;
    }
    dismiss();
  }

  function markVideoReady() {
    if (videoReady) return;
    videoReady = true;
    tryDismiss();
  }

  function onReady() {
    pageReady = true;
    tryDismiss();
  }

  if (!videoReady) {
    document.addEventListener("dce-hero-video-ready", markVideoReady, { once: true });
    if (window.__dceHeroVideoReady) markVideoReady();
    window.setTimeout(function () {
      if (document.querySelector("video.hero-pt__video")) return;
      markVideoReady();
    }, 80);
    window.setTimeout(markVideoReady, VIDEO_WAIT_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) dismiss();
  });
})();
