(function () {
  var SLIDES = [
    {
      logo: "images/1.png",
      year: "2021",
      title: "Сопровождение базовой инфраструктуры Росавтодора",
      customer: "ООО «ОТР-безопасность информационных технологий»",
      period: "Москва, 2021 — 2024",
      lead:
        "Сопровождение, обеспечение непрерывного функционирования и развитие базовой инфраструктуры заказчика.",
    },
    {
      logo: "images/2.png",
      logoDark: "images/2_black.png",
      year: "2022",
      title: "Миграция почтовой системы Минздрава на отечественное решение",
      customer:
        "ФГБУ «Научный центр экспертизы средств медицинского применения» Министерства здравоохранения Российской Федерации",
      period: "Москва, 2022",
      lead:
        "Миграция почтовой системы, почтовых ящиков и функционального окружения пользователей на продукты отечественных производителей.",
    },
    {
      logo: "images/3.png",
      logoDark: "images/3_black.png",
      year: "2021",
      title: "Гиперконвергентная инфраструктура Дом.РФ и Банка Дом.РФ",
      customer: "АО «Банк ДОМ. РФ», АО «ДОМ. РФ»",
      period: "Москва, 2021",
      lead: "В 2021 году на основании открытой закупочной процедуры был заключен договор на создание распределенной гиперконвергентной ИТ-инфраструктуры.",
    },
    {
      logo: "images/4.png",
      year: "2022",
      title: "Поддержка непрерывности функционирования экстренных служб Москвы",
      customer: "ООО «ПРОДЖЕКТ САППОРТ»",
      period: "Москва, 2022 — 2024",
      lead:
        "Сопровождение и обеспечение непрерывного функционирования базовой инфраструктуры заказчика.",
    },
  ];

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function logoSrcForSlide(s) {
    if (isDarkTheme() && s.logoDark) return s.logoDark;
    return s.logo;
  }

  /** Длительность показа слайда и анимации заполнения сегмента (мс) — только десктоп. */
  var AUTOPLAY_MS = 6000;

  var root = document.querySelector("[data-project-showcase]");
  if (!root || !SLIDES.length) return;

  var logoEl = root.querySelector("[data-showcase-logo]");
  var titleEl = root.querySelector("[data-showcase-title]");
  var segmentsEl = root.querySelector("[data-showcase-segments]");
  var detailsEl = root.querySelector("[data-showcase-details]");
  var customerEl = root.querySelector("[data-showcase-customer]");
  var periodEl = root.querySelector("[data-showcase-period]");
  var leadEl = root.querySelector("[data-showcase-lead]");
  var yearEl = root.querySelector("[data-showcase-year]");
  var yearBadgeEl = root.querySelector("[data-showcase-year-badge]");
  var mobileCounterEl = root.querySelector("[data-showcase-mobile-counter]");
  var mobileDotsEl = root.querySelector("[data-showcase-mobile-dots]");
  var customerGroupEl = root.querySelector(".project-split__customer-group");
  var panelInner = root.querySelector(".project-split__panel-inner");
  var swipeSurface = root.querySelector(".project-split__panel");
  var prevBtn = root.querySelector("[data-showcase-prev]");
  var nextBtn = root.querySelector("[data-showcase-next]");
  var counterEl = root.querySelector("[data-showcase-counter]");
  var totalEl = root.querySelector("[data-showcase-total]");
  var progressFillEl = root.querySelector("[data-showcase-progress-fill]");

  if (!logoEl || !titleEl || !segmentsEl) return;

  function formatIndex(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  if (totalEl) totalEl.textContent = formatIndex(SLIDES.length);

  root.style.setProperty("--segment-autoplay", AUTOPLAY_MS / 1000 + "s");

  var idx = 0;
  var autoplayTimer = null;
  var activeAnim = null;
  var mobileMq = window.matchMedia("(max-width: 799px)");

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileShowcase() {
    return mobileMq.matches;
  }

  function isDesktopPanelLayout() {
    return window.matchMedia && window.matchMedia("(min-width: 800px)").matches;
  }

  function extractYear(s) {
    if (s.year) return String(s.year);
    var match = (s.period || "").match(/(\d{4})/);
    return match ? match[1] : "";
  }

  function fillDetailsDom(s) {
    var year = extractYear(s);
    if (customerEl) customerEl.textContent = s.customer || "";
    if (periodEl) periodEl.textContent = s.period || "";
    if (leadEl) leadEl.textContent = s.lead || "";
    if (yearEl) yearEl.textContent = year;
    if (yearBadgeEl) yearBadgeEl.textContent = year;
  }

  function clearRevealAnimations() {
    titleEl.classList.remove("project-split__title--reveal");
    if (detailsEl) detailsEl.classList.remove("project-split__details--anim");
    if (panelInner) panelInner.classList.remove("project-split__panel-inner--reveal");
  }

  function restartRevealAnimations() {
    if (prefersReducedMotion() || isMobileShowcase()) return;
    clearRevealAnimations();
    void titleEl.offsetWidth;
    titleEl.classList.add("project-split__title--reveal");
    if (detailsEl) detailsEl.classList.add("project-split__details--anim");
    if (panelInner) panelInner.classList.add("project-split__panel-inner--reveal");
  }

  function afterLayout(cb) {
    requestAnimationFrame(function () {
      requestAnimationFrame(cb);
    });
  }

  function waitLogoDecoded(then) {
    if (logoEl.decode) {
      logoEl.decode().then(then).catch(then);
      return;
    }
    if (logoEl.complete) {
      then();
      return;
    }
    function done() {
      logoEl.onload = null;
      logoEl.onerror = null;
      then();
    }
    logoEl.onload = done;
    logoEl.onerror = done;
  }

  function measurePanelMinHeight(done) {
    done = done || function () {};

    if (!panelInner) {
      done();
      return;
    }

    clearAutoplay();
    root.classList.add("is-measuring-panel");

    var maxH = 0;
    var maxTitleH = 0;
    var maxCustomerH = 0;
    var maxLeadH = 0;
    var i = 0;

    function finishMeasure() {
      root.style.setProperty("--project-showcase-panel-min", maxH + "px");
    if (isMobileShowcase()) {
      root.style.setProperty("--project-showcase-title-min", maxTitleH + "px");
      root.style.setProperty("--project-showcase-customer-min", maxCustomerH + "px");
      root.style.setProperty("--project-showcase-lead-min", maxLeadH + "px");
      root.style.setProperty("--project-showcase-progress", (idx + 1) / SLIDES.length);
      root.classList.add("is-ready");
    } else {
        root.classList.remove("is-ready");
        root.style.removeProperty("--project-showcase-title-min");
        root.style.removeProperty("--project-showcase-customer-min");
        root.style.removeProperty("--project-showcase-lead-min");
      }
      root.classList.remove("is-measuring-panel");
      applySlide();
      if (document.hidden) clearAutoplay();
      done();
    }

    function measureSlideContent(s, next) {
      titleEl.textContent = s.title;
      fillDetailsDom(s);
      clearRevealAnimations();
      afterLayout(function () {
        var titleH = titleEl.offsetHeight;
        var customerH = customerGroupEl ? customerGroupEl.offsetHeight : 0;
        var leadH = leadEl ? leadEl.offsetHeight : 0;
        var panelH = panelInner.offsetHeight;
        if (titleH > maxTitleH) maxTitleH = titleH;
        if (customerH > maxCustomerH) maxCustomerH = customerH;
        if (leadH > maxLeadH) maxLeadH = leadH;
        if (panelH > maxH) maxH = panelH;
        next();
      });
    }

    function measureNext() {
      if (i >= SLIDES.length) {
        finishMeasure();
        return;
      }

      var s = SLIDES[i];
      if (isMobileShowcase()) {
        measureSlideContent(s, function () {
          i += 1;
          measureNext();
        });
        return;
      }

      logoEl.src = logoSrcForSlide(s);
      waitLogoDecoded(function () {
        measureSlideContent(s, function () {
          i += 1;
          measureNext();
        });
      });
    }

    measureNext();
  }

  var measureDebounce = null;
  function schedulePanelMeasure() {
    if (measureDebounce !== null) {
      clearTimeout(measureDebounce);
    }
    measureDebounce = window.setTimeout(function () {
      measureDebounce = null;
      measurePanelMinHeight(function () {});
    }, 160);
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (isMobileShowcase() || root.classList.contains("is-autoplay-paused")) return;
    autoplayTimer = window.setTimeout(function () {
      autoplayTimer = null;
      go(idx + 1);
    }, AUTOPLAY_MS);
  }

  function pauseAutoplay() {
    root.classList.add("is-autoplay-paused");
    clearAutoplay();
    if (activeAnim && activeAnim.pause) {
      try {
        activeAnim.pause();
      } catch (e) {
        /* noop */
      }
    }
  }

  function cancelActiveAnim() {
    if (activeAnim && activeAnim.cancel) {
      try {
        activeAnim.cancel();
      } catch (e) {
        /* noop */
      }
    }
    activeAnim = null;
  }

  function restartActiveFill() {
    cancelActiveAnim();

    if (isMobileShowcase()) {
      if (progressFillEl) progressFillEl.style.transform = "scaleX(0)";
      return;
    }

    if (progressFillEl) progressFillEl.style.transform = "scaleX(0)";

    if (prefersReducedMotion() || SLIDES.length < 2) {
      if (progressFillEl) progressFillEl.style.transform = "scaleX(1)";
      return;
    }

    if (root.classList.contains("is-autoplay-paused") || document.hidden) {
      return;
    }

    if (!progressFillEl || typeof progressFillEl.animate !== "function") {
      if (progressFillEl) progressFillEl.style.transform = "scaleX(1)";
      return;
    }

    activeAnim = progressFillEl.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: AUTOPLAY_MS, fill: "forwards", easing: "linear" }
    );
  }

  function resumeAutoplay() {
    if (isMobileShowcase()) return;
    root.classList.remove("is-autoplay-paused");
    if (activeAnim && activeAnim.playState === "paused" && activeAnim.play) {
      try {
        activeAnim.play();
      } catch (e) {
        /* noop */
      }
      var remaining = AUTOPLAY_MS;
      try {
        remaining = Math.max(0, AUTOPLAY_MS - (activeAnim.currentTime || 0));
      } catch (e) {
        /* noop */
      }
      clearAutoplay();
      if (SLIDES.length >= 2) {
        autoplayTimer = window.setTimeout(function () {
          autoplayTimer = null;
          go(idx + 1);
        }, remaining);
      }
      return;
    }
    restartActiveFill();
    scheduleAutoplay();
  }

  function renderSegments() {
    cancelActiveAnim();
    segmentsEl.innerHTML = "";
    if (mobileDotsEl) mobileDotsEl.innerHTML = "";

    SLIDES.forEach(function (_, i) {
      var seg = document.createElement("button");
      seg.type = "button";
      seg.className = "project-split__segment" + (i === idx ? " project-split__segment--active" : "");
      seg.setAttribute("aria-label", "Проект " + (i + 1) + " из " + SLIDES.length);
      seg.setAttribute("role", "tab");
      seg.setAttribute("aria-selected", i === idx ? "true" : "false");
      if (i === idx) {
        seg.setAttribute("aria-current", "true");
      }
      seg.addEventListener("click", function () {
        go(i);
      });
      segmentsEl.appendChild(seg);

      if (mobileDotsEl) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "project-showcase__mobile-dot" + (i === idx ? " is-active" : "");
        dot.setAttribute("aria-label", "Проект " + (i + 1) + " из " + SLIDES.length);
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-selected", i === idx ? "true" : "false");
        if (i === idx) {
          dot.setAttribute("aria-current", "true");
        }
        dot.addEventListener("click", function () {
          go(i);
        });
        mobileDotsEl.appendChild(dot);
      }
    });
  }

  function applySlide() {
    var s = SLIDES[idx];
    if (!isMobileShowcase()) {
      logoEl.src = logoSrcForSlide(s);
    }
    titleEl.textContent = s.title;
    fillDetailsDom(s);
    renderSegments();
    if (counterEl) counterEl.textContent = formatIndex(idx + 1);
    if (mobileCounterEl) {
      mobileCounterEl.textContent = formatIndex(idx + 1) + " / " + formatIndex(SLIDES.length);
    }
    if (isMobileShowcase()) {
      root.style.setProperty("--project-showcase-progress", (idx + 1) / SLIDES.length);
    }
    if (prefersReducedMotion() || isMobileShowcase()) {
      clearRevealAnimations();
    } else {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          restartRevealAnimations();
        });
      });
    }
    restartActiveFill();
    scheduleAutoplay();
  }

  function go(nextIdx) {
    var n = SLIDES.length;
    idx = ((nextIdx % n) + n) % n;
    clearAutoplay();

    if (prefersReducedMotion() || isMobileShowcase()) {
      if (isMobileShowcase() && panelInner) {
        panelInner.classList.add("is-fading");
        window.setTimeout(function () {
          applySlide();
          panelInner.classList.remove("is-fading");
        }, 140);
        return;
      }
      applySlide();
      return;
    }

    root.classList.add("is-transitioning");
    window.setTimeout(function () {
      applySlide();
      root.classList.remove("is-transitioning");
    }, 140);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      go(idx - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      go(idx + 1);
    });
  }

  root.addEventListener("keydown", function (e) {
    if (e.target !== root && !root.contains(e.target)) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(idx - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(idx + 1);
    }
  });

  root.tabIndex = 0;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      pauseAutoplay();
    } else {
      resumeAutoplay();
    }
  });

  /* Свайп на мобильных */
  var touchStartX = 0;
  var touchStartY = 0;
  var touchActive = false;

  function isSwipeBlockedTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      "a, button, input, textarea, select, label, .project-split__controls, .project-split__cta"
    );
  }

  if (swipeSurface) {
    swipeSurface.addEventListener(
      "touchstart",
      function (e) {
        if (!isMobileShowcase() || !e.touches || e.touches.length !== 1) return;
        if (isSwipeBlockedTarget(e.target)) {
          touchActive = false;
          return;
        }
        touchActive = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    swipeSurface.addEventListener(
      "touchmove",
      function (e) {
        if (!touchActive || !e.touches || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - touchStartX;
        var dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    swipeSurface.addEventListener(
      "touchend",
      function (e) {
        if (!touchActive || !e.changedTouches || e.changedTouches.length !== 1) {
          touchActive = false;
          return;
        }
        touchActive = false;
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
        if (dx < 0) go(idx + 1);
        else go(idx - 1);
      },
      { passive: true }
    );

    swipeSurface.addEventListener("touchcancel", function () {
      touchActive = false;
    });
  }

  mobileMq.addEventListener("change", function () {
    clearAutoplay();
    cancelActiveAnim();
    root.classList.remove("is-ready");
    schedulePanelMeasure();
  });

  renderSegments();
  restartActiveFill();
  titleEl.textContent = SLIDES[0].title;
  fillDetailsDom(SLIDES[0]);
  if (prefersReducedMotion() || isMobileShowcase()) {
    clearRevealAnimations();
  } else {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        restartRevealAnimations();
      });
    });
  }

  function runInitialMeasure() {
    measurePanelMinHeight(function () {
      if (isDesktopPanelLayout() && !document.hidden) {
        scheduleAutoplay();
      }
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runInitialMeasure).catch(runInitialMeasure);
  } else {
    afterLayout(runInitialMeasure);
  }

  window.addEventListener("resize", schedulePanelMeasure);

  try {
    var themeObserver = new MutationObserver(function () {
      if (!logoEl || isMobileShowcase()) return;
      logoEl.src = logoSrcForSlide(SLIDES[idx]);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  } catch (e) {
    /* ignore */
  }
})();
