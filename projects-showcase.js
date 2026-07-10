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

  /** Длительность показа слайда и анимации заполнения сегмента (мс). */
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
  var panelInner = root.querySelector(".project-split__panel-inner");
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

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function extractYear(s) {
    if (s.year) return String(s.year);
    var match = (s.period || "").match(/(\d{4})/);
    return match ? match[1] : "";
  }

  function fillDetailsDom(s) {
    if (customerEl) customerEl.textContent = s.customer || "";
    if (periodEl) periodEl.textContent = s.period || "";
    if (leadEl) leadEl.textContent = s.lead || "";
    if (yearEl) yearEl.textContent = extractYear(s);
  }

  function clearRevealAnimations() {
    titleEl.classList.remove("project-split__title--reveal");
    if (detailsEl) detailsEl.classList.remove("project-split__details--anim");
    if (panelInner) panelInner.classList.remove("project-split__panel-inner--reveal");
  }

  /** Заголовок → блок заказчика → лид → CTA: по очереди сверху вниз, выезд снизу вверх (CSS). */
  function restartRevealAnimations() {
    if (prefersReducedMotion()) return;
    clearRevealAnimations();
    void titleEl.offsetWidth;
    titleEl.classList.add("project-split__title--reveal");
    if (detailsEl) detailsEl.classList.add("project-split__details--anim");
    if (panelInner) panelInner.classList.add("project-split__panel-inner--reveal");
  }

  function isDesktopPanelLayout() {
    return window.matchMedia && window.matchMedia("(min-width: 800px)").matches;
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

    if (!isDesktopPanelLayout()) {
      root.style.removeProperty("--project-showcase-panel-min");
      done();
      return;
    }

    var panelInnerMeasure = root.querySelector(".project-split__panel-inner");
    if (!panelInnerMeasure) {
      done();
      return;
    }

    clearAutoplay();
    root.classList.add("is-measuring-panel");

    var maxH = 0;
    var i = 0;

    function finishMeasure() {
      root.style.setProperty("--project-showcase-panel-min", maxH + "px");
      root.classList.remove("is-measuring-panel");
      applySlide();
      if (document.hidden) clearAutoplay();
      done();
    }

    function measureNext() {
      if (i >= SLIDES.length) {
        finishMeasure();
        return;
      }

      var s = SLIDES[i];
      logoEl.src = logoSrcForSlide(s);

      waitLogoDecoded(function () {
        titleEl.textContent = s.title;
        fillDetailsDom(s);
        clearRevealAnimations();
        afterLayout(function () {
          var h = panelInnerMeasure.offsetHeight;
          if (h > maxH) maxH = h;
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
    if (root.classList.contains("is-autoplay-paused")) return;
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
    });
  }

  function applySlide() {
    var s = SLIDES[idx];
    logoEl.src = logoSrcForSlide(s);
    titleEl.textContent = s.title;
    fillDetailsDom(s);
    renderSegments();
    if (counterEl) counterEl.textContent = formatIndex(idx + 1);
    if (prefersReducedMotion()) {
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

    if (prefersReducedMotion()) {
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

  renderSegments();
  restartActiveFill();
  titleEl.textContent = SLIDES[0].title;
  fillDetailsDom(SLIDES[0]);
  if (prefersReducedMotion()) {
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
      if (!isDesktopPanelLayout() && !document.hidden) {
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
      if (!logoEl) return;
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
