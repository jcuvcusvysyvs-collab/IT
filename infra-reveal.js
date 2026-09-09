(function () {
  "use strict";

  var blocks = document.querySelectorAll("[data-infra-reveal]");
  if (!blocks.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function reveal(block) {
    if (block.classList.contains("is-visible")) return;
    block.classList.add("is-visible");
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
    {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    }
  );

  blocks.forEach(function (block) {
    /* Уже в зоне видимости при загрузке — раскрыть сразу */
    var rect = block.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.88 && rect.bottom > vh * 0.08) {
      reveal(block);
      return;
    }
    observer.observe(block);
  });
})();
