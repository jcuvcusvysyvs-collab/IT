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

  /* Триггер по верху блока в зоне чтения — не по isIntersecting:
     у высоких секций IO с threshold:0 запускал анимацию ещё под экраном,
     к моменту просмотра is-visible уже стоял (вниз «пусто», вверх — ок). */
  function enterLine(index) {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (mobileMq.matches) {
      /* 01 торчит под hero — чуть раньше; остальные — когда заголовок уже в кадре */
      return index === 0 ? vh * 0.88 : vh * 0.7;
    }
    return vh * 0.82;
  }

  function update() {
    var vh = window.innerHeight || document.documentElement.clientHeight;

    blocks.forEach(function (block, index) {
      var rect = block.getBoundingClientRect();
      var inReadingZone = rect.top < enterLine(index) && rect.bottom > vh * 0.06;

      if (inReadingZone) show(block);
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

  /* После layout hero/subnav — иначе первый замер врёт */
  requestUpdate();
  window.setTimeout(requestUpdate, 120);
  window.setTimeout(requestUpdate, 400);
})();
