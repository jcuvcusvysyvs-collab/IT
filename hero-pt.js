/* Hero на главной: слайдер из нескольких героев с авто-проигрыванием и сегментами */
(function () {
  var root = document.querySelector("[data-hero-slider]");
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
  var segments = Array.prototype.slice.call(root.querySelectorAll("[data-hero-segment]"));
  var prevBtn = root.querySelector("[data-hero-prev]");
  var nextBtn = root.querySelector("[data-hero-next]");
  var counterEl = root.querySelector("[data-hero-counter]");

  if (slides.length === 0) return;

  function formatIndex(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  /** Длительность показа слайда (мс). На ПК короче, на мобильной — дольше для чтения. */
  var AUTOPLAY_MS_DESKTOP = 18000;
  var AUTOPLAY_MS_MOBILE = 25000;
  var desktopMq = window.matchMedia("(min-width: 721px)");

  function getAutoplayMs() {
    return desktopMq.matches ? AUTOPLAY_MS_DESKTOP : AUTOPLAY_MS_MOBILE;
  }

  function syncAutoplayCssVar() {
    root.style.setProperty("--hero-slide-autoplay", getAutoplayMs() / 1000 + "s");
  }

  syncAutoplayCssVar();

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var idx = 0;
  var autoplayTimer = null;
  var manualPause = false;
  var pausedByFocus = false;
  var focusPauseSuppressed = false;
  var activeAnim = null;

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (manualPause || reduceMotion || slides.length < 2) return;
    autoplayTimer = window.setTimeout(function () {
      autoplayTimer = null;
      show(idx + 1);
    }, getAutoplayMs());
  }

  function cancelActiveAnim() {
    if (activeAnim && activeAnim.cancel) {
      try { activeAnim.cancel(); } catch (e) { /* noop */ }
    }
    activeAnim = null;
  }

  function restartActiveFill() {
    cancelActiveAnim();
    segments.forEach(function (seg) {
      var f = seg.querySelector(".hero-pt__segment-fill");
      if (f) f.style.transform = "scaleX(0)";
    });

    var activeSeg = segments[idx];
    if (!activeSeg) return;
    var fill = activeSeg.querySelector(".hero-pt__segment-fill");
    if (!fill) return;

    if (reduceMotion) {
      fill.style.transform = "scaleX(1)";
      return;
    }

    if (typeof fill.animate !== "function") {
      fill.style.transform = "scaleX(1)";
      return;
    }

    activeAnim = fill.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: getAutoplayMs(), fill: "forwards", easing: "linear" }
    );
  }

  var revealToken = 0;

  function restartReveal() {
    var token = ++revealToken;
    slides.forEach(function (slide) {
      slide.classList.remove("is-revealing");
    });

    whenHeroVisible(function () {
      if (token !== revealToken) return;
      var activeSlide = slides[idx];
      if (!activeSlide) return;

      void activeSlide.offsetWidth;

      window.requestAnimationFrame(function () {
        if (token !== revealToken) return;
        activeSlide.classList.add("is-revealing");
        scheduleStatCount(activeSlide);
      });
    });
  }

  var statsToken = 0;

  function setStatValue(el, n) {
    var text = String(Math.round(n));
    var node = el.firstChild;
    if (node && node.nodeType === 3) {
      node.textContent = text;
    } else {
      el.insertBefore(document.createTextNode(text), el.firstChild);
    }
  }

  function cancelStat(el) {
    if (el._statTimer) {
      clearTimeout(el._statTimer);
      el._statTimer = null;
    }
    if (el._statRaf) {
      cancelAnimationFrame(el._statRaf);
      el._statRaf = null;
    }
  }

  function finishSlideStats(slide) {
    var els = slide.querySelectorAll(".hero-pt__stat-num[data-count]");
    els.forEach(function (el) {
      cancelStat(el);
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isFinite(target)) setStatValue(el, target);
    });
    slide.setAttribute("data-stats-done", "true");
    slide.removeAttribute("data-stats-started");
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function animateSlideStats(slide) {
    var token = ++statsToken;
    var els = slide.querySelectorAll(".hero-pt__stat-num[data-count]");
    var pending = els.length;
    if (!pending) {
      slide.setAttribute("data-stats-done", "true");
      return;
    }

    els.forEach(function (el, i) {
      cancelStat(el);
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (!isFinite(target)) {
        pending -= 1;
        return;
      }
      setStatValue(el, 0);
      el._statTimer = window.setTimeout(function () {
        if (token !== statsToken) return;
        var started = null;
        var duration = 2200 + Math.min(target, 300) * 0.6;
        function frame(now) {
          if (token !== statsToken) return;
          if (started === null) started = now;
          var t = Math.min(1, (now - started) / duration);
          setStatValue(el, target * easeInOutSine(t));
          if (t < 1) {
            el._statRaf = window.requestAnimationFrame(frame);
          } else {
            setStatValue(el, target);
            el._statRaf = null;
            pending -= 1;
            if (pending <= 0 && slide.getAttribute("data-stats-started") === "true") {
              slide.setAttribute("data-stats-done", "true");
              slide.removeAttribute("data-stats-started");
            }
          }
        }
        el._statRaf = window.requestAnimationFrame(frame);
      }, 140 * i);
    });
  }

  function isLoaderGone() {
    if (window.__dcePageLoaderDone) return true;
    if (document.documentElement.classList.contains("is-loading")) return false;
    return !document.querySelector(".page-loader");
  }

  function whenHeroVisible(cb) {
    var done = false;
    var observer = null;

    function run() {
      if (done) return;
      done = true;
      if (observer) observer.disconnect();
      cb();
    }

    if (isLoaderGone()) {
      run();
      return;
    }

    document.addEventListener("dce-page-loader-done", run, { once: true });
    observer = new MutationObserver(function () {
      if (isLoaderGone()) run();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    if (document.body) {
      observer.observe(document.body, { childList: true });
    }
    window.setTimeout(run, 10000);
  }

  function scheduleStatCount(slide) {
    if (reduceMotion) return;
    if (slide.getAttribute("data-stats-done") === "true") return;

    slides.forEach(function (other) {
      if (other !== slide && other.getAttribute("data-stats-started") === "true") {
        finishSlideStats(other);
      }
    });

    slide.setAttribute("data-stats-started", "true");
    var els = slide.querySelectorAll(".hero-pt__stat-num[data-count]");
    els.forEach(function (el) {
      cancelStat(el);
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isFinite(target)) setStatValue(el, 0);
    });
    whenHeroVisible(function () {
      if (!slide.classList.contains("is-active")) {
        finishSlideStats(slide);
        return;
      }
      if (slide.getAttribute("data-stats-done") === "true") return;
      animateSlideStats(slide);
    });
  }

  function saveDataOrSlowNet() {
    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return false;
      if (conn.saveData) return true;
      var type = conn.effectiveType;
      return type === "slow-2g" || type === "2g";
    } catch (e) {
      return false;
    }
  }

  function notifyHeroVideoReady() {
    if (window.__dceHeroVideoReady) return;
    window.__dceHeroVideoReady = true;
    try {
      document.dispatchEvent(new CustomEvent("dce-hero-video-ready"));
    } catch (e) {
      /* noop */
    }
  }

  function pickHeroVideoSrc() {
    return desktopMq.matches
      ? "video/data-center-hero.mp4"
      : "video/data-center-hero-mobile.mp4?v=20260818-m1080";
  }

  function isVideoFullyBuffered(video) {
    if (!video.duration || !isFinite(video.duration)) return false;
    try {
      var end = 0;
      for (var i = 0; i < video.buffered.length; i++) {
        if (video.buffered.end(i) > end) end = video.buffered.end(i);
      }
      return end >= video.duration - 0.2;
    } catch (e) {
      return video.readyState >= 4;
    }
  }

  function bufferedLead(video) {
    try {
      if (!video.buffered.length) return 0;
      var t = video.currentTime || 0;
      var end = 0;
      for (var i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= t + 0.15) {
          end = Math.max(end, video.buffered.end(i));
        }
      }
      return Math.max(0, end - t);
    } catch (e) {
      return 0;
    }
  }

  function hasEnoughHeroBuffer(video) {
    if (isVideoFullyBuffered(video) || video.readyState >= 4) return true;
    var need = desktopMq.matches ? 0.9 : 1.6;
    return video.readyState >= 3 && bufferedLead(video) >= need;
  }

  function ensureHeroVideoSrc(video) {
    if (video.getAttribute("data-src-ready") === "1") return;
    video.preload = "auto";
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = false;
    video.src = pickHeroVideoSrc();
    video.setAttribute("data-src-ready", "1");
    try {
      video.load();
    } catch (e) {
      /* noop */
    }
  }

  function attachHeroVideoGuards(video) {
    if (video.getAttribute("data-loop-guard") === "1") return;
    video.setAttribute("data-loop-guard", "1");

    video.addEventListener("progress", function () {
      if (isVideoFullyBuffered(video)) video.loop = true;
    });

    video.addEventListener("canplaythrough", function () {
      if (isVideoFullyBuffered(video)) video.loop = true;
    });

    video.addEventListener("error", function () {
      notifyHeroVideoReady();
    });

    video.addEventListener("ended", function () {
      if (document.hidden || reduceMotion || saveDataOrSlowNet()) return;
      var slide = video.closest("[data-hero-slide]");
      if (slide && !slide.classList.contains("is-active")) return;
      if (!isVideoFullyBuffered(video) && video.readyState < 3) return;
      try {
        video.currentTime = 0;
      } catch (e) {
        /* noop */
      }
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    });
  }

  function rewindHeroVideo(video) {
    try {
      video.pause();
    } catch (e) {
      /* noop */
    }
    try {
      if (video.currentTime > 0.05) video.currentTime = 0;
    } catch (e) {
      /* noop */
    }
  }

  function waitForHeroBuffer(video, cb) {
    if (hasEnoughHeroBuffer(video)) {
      cb();
      return;
    }
    var settled = false;
    var timer = window.setInterval(onReady, 200);
    function onReady() {
      if (settled || !hasEnoughHeroBuffer(video)) return;
      settled = true;
      window.clearInterval(timer);
      video.removeEventListener("progress", onReady);
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      cb();
    }
    video.addEventListener("progress", onReady);
    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
  }

  function playHeroVideoWhenReady(video) {
    if (reduceMotion || saveDataOrSlowNet() || document.hidden) return;
    var slide = video.closest("[data-hero-slide]");
    if (slide && !slide.classList.contains("is-active")) return;

    function tryPlay() {
      if (document.hidden || reduceMotion || saveDataOrSlowNet()) return;
      if (slide && !slide.classList.contains("is-active")) return;
      notifyHeroVideoReady();
      var playPromise = video.play();
      if (playPromise && playPromise.then) {
        playPromise
          .then(function () {
            video.classList.add("is-ready");
          })
          .catch(function () {
            video.classList.add("is-ready");
          });
      } else {
        video.classList.add("is-ready");
      }
    }

    waitForHeroBuffer(video, tryPlay);
  }

  function beginHeroVideoLoad() {
    if (reduceMotion || saveDataOrSlowNet()) {
      notifyHeroVideoReady();
      return;
    }
    var hasVideo = false;
    slides.forEach(function (slide) {
      var video = slide.querySelector("video.hero-pt__video");
      if (!video) return;
      hasVideo = true;
      ensureHeroVideoSrc(video);
      attachHeroVideoGuards(video);
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
      waitForHeroBuffer(video, function () {
        rewindHeroVideo(video);
        notifyHeroVideoReady();
      });
    });
    if (!hasVideo) notifyHeroVideoReady();
  }

  function syncSlideMedia() {
    slides.forEach(function (slide, i) {
      var video = slide.querySelector("video.hero-pt__video");
      if (!video) return;
      var skip = reduceMotion || saveDataOrSlowNet() || document.hidden;
      if (i === idx && !skip) {
        ensureHeroVideoSrc(video);
        attachHeroVideoGuards(video);
        playHeroVideoWhenReady(video);
      } else {
        video.classList.remove("is-ready");
        if (!video.paused) {
          try {
            video.pause();
          } catch (e) {
            /* noop */
          }
        }
      }
    });
  }

  beginHeroVideoLoad();

  function applyActiveState() {
    slides.forEach(function (slide, i) {
      var isActive = i === idx;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
    segments.forEach(function (seg, i) {
      var isActive = i === idx;
      seg.classList.toggle("is-active", isActive);
      seg.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        seg.setAttribute("aria-current", "true");
      } else {
        seg.removeAttribute("aria-current");
      }
    });
    if (counterEl) counterEl.textContent = formatIndex(idx + 1);
    syncSlideMedia();
  }

  function show(nextIdx) {
    var n = slides.length;
    idx = ((nextIdx % n) + n) % n;
    manualPause = false;
    pausedByFocus = false;
    root.classList.remove("is-paused");
    applyActiveState();
    restartReveal();
    restartActiveFill();
    scheduleAutoplay();
  }

  function pauseAutoplay() {
    manualPause = true;
    root.classList.add("is-paused");
    clearAutoplay();
    if (activeAnim && activeAnim.pause) {
      try { activeAnim.pause(); } catch (e) { /* noop */ }
    }
  }

  function resumeAutoplay() {
    manualPause = false;
    root.classList.remove("is-paused");
    if (activeAnim && activeAnim.playState === "paused" && activeAnim.play) {
      try { activeAnim.play(); } catch (e) { /* noop */ }
      var remaining = getAutoplayMs();
      try {
        var current = activeAnim.currentTime || 0;
        remaining = Math.max(0, getAutoplayMs() - current);
      } catch (e) { /* noop */ }
      clearAutoplay();
      if (!reduceMotion && slides.length >= 2) {
        autoplayTimer = window.setTimeout(function () {
          autoplayTimer = null;
          show(idx + 1);
        }, remaining);
      }
      return;
    }
    restartActiveFill();
    scheduleAutoplay();
  }

  function restartPlayback() {
    manualPause = false;
    pausedByFocus = false;
    root.classList.remove("is-paused");
    clearAutoplay();
    cancelActiveAnim();
    applyActiveState();
    restartActiveFill();
    scheduleAutoplay();
  }

  function scheduleRestartPlayback() {
    focusPauseSuppressed = true;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (document.hidden) {
          focusPauseSuppressed = false;
          return;
        }
        var active = document.activeElement;
        if (active && root.contains(active) && typeof active.blur === "function") {
          try { active.blur(); } catch (e) { /* noop */ }
        }
        restartPlayback();
        window.setTimeout(function () {
          focusPauseSuppressed = false;
        }, 120);
      });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      show(idx - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      show(idx + 1);
    });
  }

  segments.forEach(function (seg, i) {
    seg.addEventListener("click", function () {
      if (i === idx) return;
      show(i);
    });
  });

  root.addEventListener("focusin", function (e) {
    if (focusPauseSuppressed) return;
    var target = e.target;
    var isKeyboardFocus = false;
    try {
      isKeyboardFocus = !!(target && target.matches && target.matches(":focus-visible"));
    } catch (err) { /* noop */ }
    if (!isKeyboardFocus) return;
    pausedByFocus = true;
    pauseAutoplay();
  });
  root.addEventListener("focusout", function (e) {
    if (!pausedByFocus) return;
    if (root.contains(e.relatedTarget)) return;
    pausedByFocus = false;
    resumeAutoplay();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearAutoplay();
      if (activeAnim && activeAnim.pause) {
        try { activeAnim.pause(); } catch (e) { /* noop */ }
      }
      syncSlideMedia();
    } else if (!manualPause) {
      scheduleRestartPlayback();
      syncSlideMedia();
    }
  });

  window.addEventListener("pageshow", function () {
    scheduleRestartPlayback();
  });

  window.addEventListener("pagehide", function () {
    clearAutoplay();
    cancelActiveAnim();
    manualPause = false;
    pausedByFocus = false;
    root.classList.remove("is-paused");
  });

  root.tabIndex = root.tabIndex || -1;
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(idx - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      show(idx + 1);
    }
  });

  var touchStartX = 0;
  var touchStartY = 0;
  var touchActive = false;
  var touchSwipeEnabled = false;

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  }

  function isSwipeBlockedTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      "a, button, input, textarea, select, label, .hero-pt__controls, .hero-pt__ctas"
    );
  }

  root.addEventListener(
    "touchstart",
    function (e) {
      if (!isMobileViewport() || !e.touches || e.touches.length !== 1) return;
      if (isSwipeBlockedTarget(e.target)) {
        touchActive = false;
        touchSwipeEnabled = false;
        return;
      }
      touchActive = true;
      touchSwipeEnabled = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  root.addEventListener(
    "touchmove",
    function (e) {
      if (!touchActive || !touchSwipeEnabled || !e.touches || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  root.addEventListener(
    "touchend",
    function (e) {
      if (!touchActive || !touchSwipeEnabled || !e.changedTouches || e.changedTouches.length !== 1) {
        touchActive = false;
        touchSwipeEnabled = false;
        return;
      }
      touchActive = false;
      touchSwipeEnabled = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      if (dx < 0) show(idx + 1);
      else show(idx - 1);
    },
    { passive: true }
  );

  root.addEventListener("touchcancel", function () {
    touchActive = false;
    touchSwipeEnabled = false;
  });

  applyActiveState();
  restartReveal();
  whenHeroVisible(function () {
    restartActiveFill();
    scheduleAutoplay();
  });

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", function () {
      syncAutoplayCssVar();
      if (!manualPause && !document.hidden) {
        restartPlayback();
      }
    });
  }
})();
