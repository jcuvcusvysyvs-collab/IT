(function () {
  "use strict";

  var blocks = document.querySelectorAll("[data-infra-reveal]");
  if (!blocks.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(block) {
    block.classList.add("is-visible");
  }

  function hide(block) {
    block.classList.remove("is-visible");
  }

  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    blocks.forEach(function (block) {
      block.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
        } else {
          hide(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.14,
    }
  );

  blocks.forEach(function (block) {
    observer.observe(block);
  });
})();
