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

  /*
   * Sequence is driven by JS (not CSS keyframe clocks), so it stays in sync
   * even when styles.css is late on heavy pages like the home hero.
   */
  var SLOT_MS = reduced && !force ? 0 : firstVisit ? 720 : 560;
  var SETTLE_MS = reduced && !force ? 360 : firstVisit ? 420 : 320;
  var FADE_MS = reduced && !force ? 280 : firstVisit ? 480 : 380;
  var MIN_MS = reduced && !force ? 420 : SLOT_MS * 3 + SETTLE_MS;
  var isDesktop =
    window.matchMedia && window.matchMedia("(min-width: 721px)").matches;
  var VIDEO_WAIT_MS = isDesktop ? 5500 : 7000;

  var critical = document.createElement("style");
  critical.id = "page-loader-critical";
  critical.textContent =
    "html.is-loading,html.is-loading body{overflow:hidden;height:100%;}" +
    ".page-loader{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;" +
    "background:rgba(244,246,250,.2);color:#0d1117;" +
    "-webkit-backdrop-filter:blur(24px) saturate(1.22);backdrop-filter:blur(24px) saturate(1.22);}" +
    'html[data-theme="dark"] .page-loader{background:rgba(10,14,20,.18);color:#eef2f8;}' +
    ".page-loader__stage{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;" +
    "width:min(100%,92vw);padding:0 1.25rem;transform:scale(1);filter:blur(0);" +
    "transition:transform .48s cubic-bezier(.22,1,.36,1),filter .48s ease;}" +
    ".page-loader.is-leaving{opacity:0;visibility:hidden;pointer-events:none;" +
    "transition:opacity .48s cubic-bezier(.22,1,.36,1),visibility 0s linear .48s;}" +
    ".page-loader.is-leaving .page-loader__stage{transform:scale(1.03);filter:blur(10px);}" +
    ".page-loader__morph{position:relative;width:100%;display:flex;align-items:center;justify-content:center;" +
    'filter:url("#dce-loader-goo");-webkit-filter:url("#dce-loader-goo");}' +
    ".page-loader__goo{position:absolute;width:1px;height:1px;overflow:hidden;pointer-events:none;}" +
    ".page-loader__words{position:relative;display:inline-flex;align-items:center;justify-content:center;" +
    "min-height:1.15em;line-height:1.15;font-family:Oswald,Manrope,system-ui,sans-serif;font-weight:700;" +
    "font-size:clamp(2.6rem,11.5vw,7.75rem);letter-spacing:.02em;text-transform:uppercase;}" +
    ".page-loader__ghost{visibility:hidden;white-space:nowrap;display:inline-block;}" +
    ".page-loader__word{position:absolute;top:50%;left:50%;white-space:nowrap;opacity:0;" +
    "filter:blur(18px);transform:translate(-50%,-50%) scale(.86);" +
    "transition:opacity .55s cubic-bezier(.33,.1,.25,1),filter .55s cubic-bezier(.33,.1,.25,1)," +
    "transform .55s cubic-bezier(.33,.1,.25,1);}" +
    ".page-loader--fast .page-loader__word{transition-duration:.4s;}" +
    ".page-loader__word.is-active{opacity:1;filter:blur(0);transform:translate(-50%,-50%) scale(1);}" +
    ".page-loader__word.is-exit{opacity:0;filter:blur(16px);transform:translate(-50%,-50%) scale(1.12);}" +
    ".page-loader--done .page-loader__word{transition-duration:.28s;}" +
    ".page-loader--done .page-loader__word.is-active," +
    ".page-loader--done .page-loader__word--eng{opacity:1;filter:none;transform:translate(-50%,-50%) scale(1);}" +
    ".page-loader--done .page-loader__word--data," +
    ".page-loader--done .page-loader__word--center{opacity:0;filter:blur(12px);transform:translate(-50%,-50%) scale(1.08);}" +
    ".page-loader--static .page-loader__morph{filter:none;}" +
    ".page-loader--static .page-loader__word{transition:none;}" +
    ".page-loader--static .page-loader__word--data," +
    ".page-loader--static .page-loader__word--center{display:none;}" +
    ".page-loader--static .page-loader__word--eng{opacity:1;filter:none;transform:translate(-50%,-50%) scale(1);}";
  (document.head || html).appendChild(critical);

  var overlay = null;
  var wordEls = [];
  var dismissed = false;
  var phraseDone = !!(reduced && !force);
  var startedAt = Date.now();
  var pageReady = document.readyState !== "loading";
  var videoReady = !!(reduced && !force);
  var phraseTimers = [];

  var MARKUP =
    '<span class="visually-hidden">Загрузка DC Engineering</span>' +
    '<div class="page-loader__stage">' +
    '<div class="page-loader__morph">' +
    '<svg class="page-loader__goo" aria-hidden="true" focusable="false">' +
    "<defs>" +
    '<filter id="dce-loader-goo" color-interpolation-filters="sRGB">' +
    '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8" result="goo"/>' +
    '<feComposite in="SourceGraphic" in2="goo" operator="atop"/>' +
    "</filter>" +
    "</defs>" +
    "</svg>" +
    '<div class="page-loader__words">' +
    '<span class="page-loader__ghost" aria-hidden="true">ENGINEERING</span>' +
    '<span class="page-loader__word page-loader__word--data" aria-hidden="true">DATA</span>' +
    '<span class="page-loader__word page-loader__word--center" aria-hidden="true">CENTER</span>' +
    '<span class="page-loader__word page-loader__word--eng" aria-hidden="true">ENGINEERING</span>' +
    "</div>" +
    "</div>" +
    "</div>";

  function clearPhraseTimers() {
    for (var i = 0; i < phraseTimers.length; i++) {
      window.clearTimeout(phraseTimers[i]);
    }
    phraseTimers = [];
  }

  function setActiveWord(index) {
    for (var i = 0; i < wordEls.length; i++) {
      wordEls[i].classList.remove("is-active", "is-exit");
      if (i === index) {
        wordEls[i].classList.add("is-active");
      } else if (i === index - 1) {
        wordEls[i].classList.add("is-exit");
      }
    }
  }

  function finishPhrase() {
    if (dismissed || !overlay) return;
    phraseDone = true;
    for (var i = 0; i < wordEls.length; i++) {
      wordEls[i].classList.remove("is-active", "is-exit");
    }
    if (wordEls[2]) wordEls[2].classList.add("is-active");
    overlay.classList.add("page-loader--done");
    tryDismiss();
  }

  function playPhrase() {
    if (reduced && !force) {
      finishPhrase();
      return;
    }

    setActiveWord(0);
    phraseTimers.push(
      window.setTimeout(function () {
        if (dismissed) return;
        setActiveWord(1);
      }, SLOT_MS)
    );
    phraseTimers.push(
      window.setTimeout(function () {
        if (dismissed) return;
        setActiveWord(2);
      }, SLOT_MS * 2)
    );
    phraseTimers.push(
      window.setTimeout(function () {
        finishPhrase();
      }, SLOT_MS * 3)
    );
  }

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
    wordEls = Array.prototype.slice.call(overlay.querySelectorAll(".page-loader__word"));

    /* Start after paint so the first transition runs */
    requestAnimationFrame(function () {
      requestAnimationFrame(playPhrase);
    });
  }

  mount();

  /* Logo → home: always full navigation (hash/bfcache could revive a stale loader) */
  document.addEventListener(
    "click",
    function (event) {
      var link = event.target && event.target.closest ? event.target.closest("a.logo") : null;
      if (!link) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var href = link.getAttribute("href") || "";
      if (href === "#top" || href === "#" || href === "") return;

      var goesHome =
        /(?:^|\/)index\.html(?:[?#]|$)/i.test(href) ||
        href === "/" ||
        href === "./";
      if (!goesHome) return;

      event.preventDefault();
      window.location.assign("index.html");
    },
    true
  );

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
    clearPhraseTimers();

    html.classList.remove("is-loading");
    html.removeAttribute("aria-busy");

    if (!overlay) {
      overlay = document.querySelector(".page-loader");
    }
    if (!overlay) {
      notifyLoaderDone();
      return;
    }

    overlay.classList.add("page-loader--done");
    if (wordEls[2]) {
      for (var i = 0; i < wordEls.length; i++) {
        wordEls[i].classList.remove("is-active", "is-exit");
      }
      wordEls[2].classList.add("is-active");
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
    if (!phraseDone) return;
    var elapsed = Date.now() - startedAt;
    var minHold = Math.max(MIN_MS, SLOT_MS * 3 + SETTLE_MS);
    if (elapsed < minHold) {
      window.setTimeout(tryDismiss, minHold - elapsed);
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

  /* bfcache: strip any stale loader snapshot from a previous visit */
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    clearPhraseTimers();
    html.classList.remove("is-loading");
    html.removeAttribute("aria-busy");
    var stale = document.querySelector(".page-loader");
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    if (critical && critical.parentNode) critical.parentNode.removeChild(critical);
    overlay = null;
    dismissed = true;
    notifyLoaderDone();
  });
})();
