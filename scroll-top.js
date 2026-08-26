(function () {
  var HERO_SEL = ".hero-pt, .subpage-hero, [data-subpage-hero], [data-hero-slider]";
  var btn = null;
  var visible = false;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setVisible(next) {
    if (!btn || next === visible) return;
    visible = next;
    btn.classList.toggle("is-visible", next);
    btn.setAttribute("aria-hidden", next ? "false" : "true");
    btn.tabIndex = next ? 0 : -1;
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function ensureButton() {
    if (btn && document.body.contains(btn)) return btn;

    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scroll-top";
    btn.setAttribute("aria-label", "Наверх");
    btn.setAttribute("aria-hidden", "true");
    btn.tabIndex = -1;
    btn.innerHTML =
      '<svg class="scroll-top__icon" viewBox="0 0 16 16" width="18" height="18" fill="none" aria-hidden="true">' +
      '<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M7.997 4.25a1 1 0 0 1 .707.293l5.765 5.764a.75.75 0 0 1 0 1.06l-.353.354a.75.75 0 0 1-1.061 0L7.997 6.664l-5.056 5.057a.75.75 0 0 1-1.06 0l-.354-.354a.75.75 0 0 1 0-1.06L7.29 4.543c.188-.187.443-.293.707-.293"/>' +
      "</svg>";

    btn.addEventListener("click", scrollToTop);
    document.body.appendChild(btn);
    return btn;
  }

  function bindHeroObserver(hero) {
    if (!("IntersectionObserver" in window)) {
      bindScrollFallback(hero);
      return;
    }

    // Порог 0: любая видимая часть hero сразу прячет кнопку (уход вниз)
    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry) return;
        var heroVisible = entry.isIntersecting || entry.intersectionRatio > 0;
        setVisible(!heroVisible);
      },
      { root: null, threshold: [0, 0.01, 0.05], rootMargin: "0px" }
    );
    observer.observe(hero);
  }

  function bindScrollFallback(hero) {
    var ticking = false;

    function update() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      // Любой пиксель hero в viewport → кнопка скрыта
      var heroVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      setVisible(!heroVisible);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function bindScrollThreshold() {
    var ticking = false;
    var threshold = Math.min(480, Math.round(window.innerHeight * 0.65));

    function update() {
      ticking = false;
      setVisible(window.scrollY > threshold);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function boot() {
    ensureButton();
    var hero = document.querySelector(HERO_SEL);
    if (hero) {
      bindHeroObserver(hero);
    } else {
      bindScrollThreshold();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
