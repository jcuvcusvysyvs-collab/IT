(function () {
  "use strict";

  var blocks = Array.prototype.slice.call(document.querySelectorAll("[data-infra-reveal]"));
  if (!blocks.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMq = window.matchMedia("(max-width: 900px)");
  var ticking = false;

  function show(block) {
    if (block.classList.contains("is-visible")) return;
    block.classList.add("is-visible");
  }

  function hide(block) {
    if (!block.classList.contains("is-visible")) return;
    block.classList.remove("is-visible");
  }

  if (reduceMotion) {
    blocks.forEach(show);
    return;
  }

  /* Стартуем чуть до появления края в viewport — к моменту, когда
     оболочка блока уже видна, контент уже в анимации, а не «пустой». */
  function update() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var lead = mobileMq.matches ? 40 : 56;

    blocks.forEach(function (block) {
      var rect = block.getBoundingClientRect();
      var entering = rect.top < vh + lead && rect.bottom > 4;

      if (entering) show(block);
      else hide(block);
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("orientationchange", requestUpdate);

  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", requestUpdate);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(requestUpdate);
  }

  requestUpdate();
  window.setTimeout(requestUpdate, 120);
  window.setTimeout(requestUpdate, 400);
})();
