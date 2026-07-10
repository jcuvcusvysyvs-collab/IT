(function () {
  "use strict";

  if (!document.body.classList.contains("page-projects")) return;

  var observed = new WeakSet();
  var observer = null;

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function reveal(block, obs) {
    block.classList.add("is-visible");
    if (obs) obs.unobserve(block);
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < vh * 0.98 && rect.bottom > 0;
  }

  function getObserver() {
    if (observer) return observer;
    if (reduceMotion() || !("IntersectionObserver" in window)) return null;

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target, observer);
        });
      },
      { root: null, rootMargin: "0px 0px 0px 0px", threshold: 0 }
    );

    return observer;
  }

  function collect() {
    return Array.prototype.slice.call(
      document.querySelectorAll(".page-projects .about-dce__block")
    );
  }

  function initProjectsPageReveal() {
    var obs = getObserver();
    var blocks = collect();

    document.body.classList.add("projects-reveal-ready");

    blocks.forEach(function (block) {
      if (observed.has(block)) return;
      observed.add(block);

      if (!block.hasAttribute("data-projects-reveal")) {
        block.setAttribute("data-projects-reveal", "");
      }

      if (!obs || isInViewport(block)) {
        reveal(block, obs);
        return;
      }

      obs.observe(block);
    });
  }

  window.initProjectsPageReveal = initProjectsPageReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectsPageReveal);
  } else {
    initProjectsPageReveal();
  }
})();
