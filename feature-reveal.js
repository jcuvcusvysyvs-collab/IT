(function () {
  var blocks = document.querySelectorAll("[data-feature-reveal]");
  if (!blocks.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function reveal(block) {
    if (block.classList.contains("is-revealing")) return;

    if (reduceMotion) {
      block.classList.add("is-revealing");
      return;
    }

    block.classList.remove("is-revealing");
    void block.offsetWidth;

    window.requestAnimationFrame(function () {
      block.classList.add("is-revealing");
    });
  }

  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    blocks.forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
  );

  blocks.forEach(function (block) {
    observer.observe(block);
  });
})();
