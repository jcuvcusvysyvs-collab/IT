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

  var AUTOPLAY_MS = 6000;

  var root = document.querySelector("[data-project-showcase]");
  if (!root || !SLIDES.length) return;

  var showcaseEl = root.querySelector(".project-showcase");
  var desktopSplit = root.querySelector(".project-split");
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
  var mobileScroller = root.querySelector("[data-showcase-mobile-scroller]");
  var mobileTrack = root.querySelector("[data-showcase-mobile-track]");
  var mobileFooterCounter = root.querySelector("[data-showcase-mobile-footer-counter]");
  var mobileProgress = root.querySelector("[data-showcase-mobile-progress]");
  var mobileProgressFill =
    mobileProgress && mobileProgress.querySelector(".projects-showcase__divider-fill");

  if (!logoEl || !titleEl || !segmentsEl) return;

  var idx = 0;
  var autoplayTimer = null;
  var activeAnim = null;
  var mobileMq = window.matchMedia("(max-width: 799px)");
  var mobileScrollRaf = null;
  var mobileCards = [];
  var MOBILE_PROGRESS_MIN = 0.25;

  function formatIndex(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  if (totalEl) totalEl.textContent = formatIndex(SLIDES.length);
  root.style.setProperty("--segment-autoplay", AUTOPLAY_MS / 1000 + "s");

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function logoSrcForSlide(s) {
    if (isDarkTheme() && s.logoDark) return s.logoDark;
    return s.logo;
  }

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

  function afterLayout(cb) {
    requestAnimationFrame(function () {
      requestAnimationFrame(cb);
    });
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

  function restartRevealAnimations() {
    if (prefersReducedMotion()) return;
    clearRevealAnimations();
    void titleEl.offsetWidth;
    titleEl.classList.add("project-split__title--reveal");
    if (detailsEl) detailsEl.classList.add("project-split__details--anim");
    if (panelInner) panelInner.classList.add("project-split__panel-inner--reveal");
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

  function createMobileCard(s, i) {
    var card = document.createElement("article");
    card.className = "project-mobile-card";
    card.setAttribute("data-showcase-mobile-card", String(i));

    var head = document.createElement("header");
    head.className = "project-mobile-card__head";

    var year = document.createElement("span");
    year.className = "project-mobile-card__year";
    year.textContent = extractYear(s);

    head.appendChild(year);

    var title = document.createElement("h3");
    title.className = "project-mobile-card__title";
    title.textContent = s.title;

    var customer = document.createElement("div");
    customer.className = "project-mobile-card__customer";

    var label = document.createElement("span");
    label.className = "project-mobile-card__label";
    label.textContent = "Заказчик";

    var name = document.createElement("p");
    name.className = "project-mobile-card__name";
    name.textContent = s.customer || "";

    var meta = document.createElement("p");
    meta.className = "project-mobile-card__meta";
    meta.textContent = s.period || "";

    customer.appendChild(label);
    customer.appendChild(name);
    customer.appendChild(meta);

    var lead = document.createElement("p");
    lead.className = "project-mobile-card__lead";
    lead.textContent = s.lead || "";

    var cta = document.createElement("a");
    cta.className = "project-mobile-card__cta";
    cta.href = "contacts.html";
    cta.textContent = "Подробнее";

    card.appendChild(head);
    card.appendChild(title);
    card.appendChild(customer);
    card.appendChild(lead);
    card.appendChild(cta);

    return card;
  }

  function updateMobileFooterCounter(activeIdx) {
    if (!mobileFooterCounter) return;
    mobileFooterCounter.textContent =
      formatIndex(activeIdx + 1) + " / " + formatIndex(SLIDES.length);
  }

  function setMobileProgress(visual) {
    var value = visual.toFixed(4);
    if (mobileProgress) {
      mobileProgress.style.setProperty("--projects-mobile-scroll", value);
    }
    if (mobileProgressFill) {
      mobileProgressFill.style.transform = "scaleX(" + value + ")";
    }
  }

  function updateMobileProgress() {
    if (!mobileScroller) return;
    var max = mobileScroller.scrollWidth - mobileScroller.clientWidth;
    var ratio = max <= 0 ? 1 : Math.min(1, Math.max(0, mobileScroller.scrollLeft / max));
    var visual = MOBILE_PROGRESS_MIN + ratio * (1 - MOBILE_PROGRESS_MIN);
    setMobileProgress(visual);
  }

  function equalizeMobileCardHeights(done) {
    done = done || function () {};
    if (!mobileCards.length) {
      done();
      return;
    }

    mobileCards.forEach(function (card) {
      card.style.minHeight = "";
    });

    afterLayout(function () {
      var maxH = 0;
      mobileCards.forEach(function (card) {
        var h = card.offsetHeight;
        if (h > maxH) maxH = h;
      });
      if (maxH > 0) {
        mobileCards.forEach(function (card) {
          card.style.minHeight = maxH + "px";
        });
      }
      done();
    });
  }

  function renderMobileCarousel() {
    if (!mobileTrack) return;
    mobileTrack.innerHTML = "";
    mobileCards = SLIDES.map(function (s, i) {
      var card = createMobileCard(s, i);
      mobileTrack.appendChild(card);
      return card;
    });
    equalizeMobileCardHeights(function () {
      updateMobileProgress();
      root.classList.add("is-ready");
    });
  }

  function getMobileIndexFromScroll() {
    if (!mobileScroller || !mobileCards.length) return idx;
    var center = mobileScroller.scrollLeft + mobileScroller.clientWidth * 0.35;
    var best = 0;
    var bestDist = Infinity;
    mobileCards.forEach(function (card, i) {
      var cardCenter = card.offsetLeft + card.offsetWidth * 0.5;
      var dist = Math.abs(cardCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  function scrollToMobileCard(i) {
    if (!mobileScroller || !mobileCards[i]) return;
    var behavior = prefersReducedMotion() ? "auto" : "smooth";
    mobileScroller.scrollTo({
      left: mobileCards[i].offsetLeft,
      behavior: behavior,
    });
    idx = i;
    updateMobileFooterCounter(idx);
  }

  function onMobileScroll() {
    if (mobileScrollRaf !== null) return;
    mobileScrollRaf = window.requestAnimationFrame(function () {
      mobileScrollRaf = null;
      updateMobileProgress();
      var next = getMobileIndexFromScroll();
      if (next !== idx) {
        idx = next;
        updateMobileFooterCounter(idx);
      }
    });
  }

  function initMobileMode() {
    renderMobileCarousel();
    updateMobileFooterCounter(0);
    if (mobileScroller) {
      mobileScroller.scrollLeft = 0;
    }
    updateMobileProgress();
  }

  function destroyMobileMode() {
    root.classList.remove("is-ready");
    if (mobileTrack) mobileTrack.innerHTML = "";
    mobileCards = [];
    setMobileProgress(MOBILE_PROGRESS_MIN);
  }

  function measurePanelMinHeight(done) {
    done = done || function () {};
    if (isMobileShowcase() || !panelInner) {
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
      applyDesktopSlide();
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
          var h = panelInner.offsetHeight;
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
    if (measureDebounce !== null) clearTimeout(measureDebounce);
    measureDebounce = window.setTimeout(function () {
      measureDebounce = null;
      if (isMobileShowcase()) {
        initMobileMode();
      } else {
        destroyMobileMode();
        measurePanelMinHeight(function () {});
      }
    }, 120);
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (!isDesktopPanelLayout() || root.classList.contains("is-autoplay-paused")) return;
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
    if (root.classList.contains("is-autoplay-paused") || document.hidden) return;
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
    if (!isDesktopPanelLayout()) return;
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

  function renderDesktopSegments() {
    cancelActiveAnim();
    segmentsEl.innerHTML = "";
    SLIDES.forEach(function (_, i) {
      var seg = document.createElement("button");
      seg.type = "button";
      seg.className = "project-split__segment" + (i === idx ? " project-split__segment--active" : "");
      seg.setAttribute("aria-label", "Проект " + (i + 1) + " из " + SLIDES.length);
      seg.setAttribute("role", "tab");
      seg.setAttribute("aria-selected", i === idx ? "true" : "false");
      if (i === idx) seg.setAttribute("aria-current", "true");
      seg.addEventListener("click", function () {
        go(i);
      });
      segmentsEl.appendChild(seg);
    });
  }

  function applyDesktopSlide() {
    var s = SLIDES[idx];
    logoEl.src = logoSrcForSlide(s);
    titleEl.textContent = s.title;
    fillDetailsDom(s);
    renderDesktopSegments();
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
    if (!isDesktopPanelLayout()) return;
    var n = SLIDES.length;
    idx = ((nextIdx % n) + n) % n;
    clearAutoplay();
    if (prefersReducedMotion()) {
      applyDesktopSlide();
      return;
    }
    root.classList.add("is-transitioning");
    window.setTimeout(function () {
      applyDesktopSlide();
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
    if (!isDesktopPanelLayout()) return;
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

  if (mobileScroller) {
    mobileScroller.addEventListener("scroll", onMobileScroll, { passive: true });
    if ("onscrollend" in mobileScroller) {
      mobileScroller.addEventListener("scrollend", updateMobileProgress, { passive: true });
    }
    window.addEventListener("resize", function () {
      if (!isMobileShowcase()) return;
      equalizeMobileCardHeights(updateMobileProgress);
    });
  }

  mobileMq.addEventListener("change", schedulePanelMeasure);

  function runInitialSetup() {
    if (isMobileShowcase()) {
      initMobileMode();
      return;
    }
    renderDesktopSegments();
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
    measurePanelMinHeight(function () {
      if (!document.hidden) scheduleAutoplay();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runInitialSetup).catch(runInitialSetup);
  } else {
    afterLayout(runInitialSetup);
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
