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

  function restartReveal() {
    slides.forEach(function (slide) {
      slide.classList.remove("is-revealing");
    });

    var activeSlide = slides[idx];
    if (!activeSlide) return;

    void activeSlide.offsetWidth;

    window.requestAnimationFrame(function () {
      activeSlide.classList.add("is-revealing");
    });
  }

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
    } else if (!manualPause) {
      scheduleRestartPlayback();
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
  restartActiveFill();
  scheduleAutoplay();

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", function () {
      syncAutoplayCssVar();
      if (!manualPause && !document.hidden) {
        restartPlayback();
      }
    });
  }
})();
