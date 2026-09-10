(function () {
  "use strict";

  var blocks = Array.prototype.slice.call(document.querySelectorAll("[data-infra-reveal]"));
  var yearHeads = Array.prototype.slice.call(document.querySelectorAll(".page-projects__year-head"));
  var yearGroups = Array.prototype.slice.call(document.querySelectorAll(".page-projects__year-group"));

  if (!blocks.length && !yearHeads.length && !yearGroups.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMq = window.matchMedia("(max-width: 900px)");
  var colsMq2 = window.matchMedia("(max-width: 1080px)");
  var colsMq1 = window.matchMedia("(max-width: 640px)");
  var ticking = false;

  function show(el) {
    if (el.classList.contains("is-visible")) return;
    el.classList.add("is-visible");
  }

  function hide(el) {
    if (!el.classList.contains("is-visible")) return;
    el.classList.remove("is-visible");
  }

  function getCols() {
    if (colsMq1.matches) return 1;
    if (colsMq2.matches) return 2;
    return 3;
  }

  function activeItems(group) {
    return Array.prototype.slice.call(group.querySelectorAll(".page-projects__item")).filter(function (el) {
      return !el.classList.contains("is-filtered-out");
    });
  }

  if (reduceMotion) {
    blocks.forEach(show);
    yearHeads.forEach(show);
    yearGroups.forEach(function (group) {
      activeItems(group).forEach(show);
    });
    return;
  }

  /* Секции — чуть раньше края; карточки проектов — только когда реально входят в кадр
     (на мобиле ранний lead прятал анимацию за нижней границей экрана). */
  function inFrame(top, bottom, leadPx) {
    return top < vhRef() + leadPx && bottom > 8;
  }

  function vhRef() {
    return window.innerHeight || document.documentElement.clientHeight;
  }

  function update() {
    var vh = vhRef();
    var blockLead = mobileMq.matches ? 36 : 64;
    /* Мобила: старт, когда верх уже ~12% экрана внутри — анимация видна при скролле.
       Десктоп: лёгкий early, чтобы ряд из 3 успел начать до полного входа. */
    var cardLead = mobileMq.matches ? -Math.round(vh * 0.12) : 28;
    var cols = getCols();
    var rowStagger = cols === 1 ? 0 : cols === 2 ? 0.08 : 0.09;

    blocks.forEach(function (block) {
      var rect = block.getBoundingClientRect();
      if (inFrame(rect.top, rect.bottom, blockLead)) show(block);
      else hide(block);
    });

    yearHeads.forEach(function (head) {
      var group = head.closest(".page-projects__year-group");
      if (group && group.classList.contains("is-filtered-empty")) {
        hide(head);
        return;
      }
      var rect = head.getBoundingClientRect();
      if (inFrame(rect.top, rect.bottom, cardLead)) show(head);
      else hide(head);
    });

    yearGroups.forEach(function (group) {
      if (group.classList.contains("is-filtered-empty")) {
        activeItems(group).forEach(hide);
        group.querySelectorAll(".page-projects__item.is-visible").forEach(hide);
        return;
      }

      var items = activeItems(group);
      var i;
      for (i = 0; i < items.length; i += cols) {
        var row = items.slice(i, i + cols);
        var firstRect = row[0].getBoundingClientRect();
        var lastRect = row[row.length - 1].getBoundingClientRect();
        var rowTop = Math.min.apply(
          null,
          row.map(function (el) {
            return el.getBoundingClientRect().top;
          })
        );
        var rowBottom = Math.max(firstRect.bottom, lastRect.bottom);
        var entering = inFrame(rowTop, rowBottom, cardLead);

        row.forEach(function (el, idx) {
          if (entering) {
            el.style.setProperty("--projects-row-delay", (idx * rowStagger).toFixed(2) + "s");
            show(el);
          } else {
            el.style.removeProperty("--projects-row-delay");
            hide(el);
          }
        });
      }

      /* Скрытые фильтром — без анимации */
      group.querySelectorAll(".page-projects__item.is-filtered-out").forEach(hide);
    });

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.refreshInfraReveal = function () {
    yearHeads = Array.prototype.slice.call(document.querySelectorAll(".page-projects__year-head"));
    yearGroups = Array.prototype.slice.call(document.querySelectorAll(".page-projects__year-group"));
    requestUpdate();
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("orientationchange", requestUpdate);

  [mobileMq, colsMq2, colsMq1].forEach(function (mq) {
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", requestUpdate);
    else if (typeof mq.addListener === "function") mq.addListener(requestUpdate);
  });

  requestUpdate();
  window.setTimeout(requestUpdate, 120);
  window.setTimeout(requestUpdate, 400);
})();
