(function () {
  var hero = document.querySelector("[data-subpage-hero]");
  if (!hero) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isLoaderGone() {
    if (window.__dcePageLoaderDone) return true;
    if (document.documentElement.classList.contains("is-loading")) return false;
    return !document.querySelector(".page-loader");
  }

  function whenLoaderDone(cb) {
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

  function startReveal() {
    if (reduceMotion) {
      hero.classList.add("is-revealing");
      return;
    }

    hero.classList.remove("is-revealing");
    void hero.offsetWidth;

    window.requestAnimationFrame(function () {
      hero.classList.add("is-revealing");
    });
  }

  whenLoaderDone(startReveal);
})();
