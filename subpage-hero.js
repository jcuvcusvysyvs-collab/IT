(function () {
  var hero = document.querySelector("[data-subpage-hero]");
  if (!hero) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startReveal);
  } else {
    startReveal();
  }
})();
