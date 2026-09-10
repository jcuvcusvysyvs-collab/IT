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

  function resetProjectBits() {
    yearHeads.forEach(function (head) {
      hide(head);
    });
    yearGroups.forEach(function (group) {
      group.querySelectorAll(".page-projects__item").forEach(function (el) {
        hide(el);
        el.style.removeProperty("--projects-row-delay");
      });
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

  function vhRef() {
    return window.innerHeight || document.documentElement.clientHeight;
  }

  function inFrame(top, bottom, leadPx) {
    return top < vhRef() + leadPx && bottom > 8;
  }

  function update() {
    var vh = vhRef();
    var blockLead = mobileMq.matches ? 36 : 64;
    /* Старт чуть после входа в кадр — анимация читается целиком */
    var cardLead = mobileMq.matches ? -Math.round(vh * 0.08) : 20;
    var cols = getCols();

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
      if (head.classList.contains("is-visible")) return;
      var rect = head.getBoundingClientRect();
      if (inFrame(rect.top, rect.bottom, cardLead)) show(head);
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
        var rowTop = Math.min.apply(
          null,
          row.map(function (el) {
            return el.getBoundingClientRect().top;
          })
        );
        var rowBottom = Math.max.apply(
          null,
          row.map(function (el) {
            return el.getBoundingClientRect().bottom;
          })
        );
        /* Весь ряд (3 / 2 / 1) появляется одновременно — без stagger слева направо */
        if (!inFrame(rowTop, rowBottom, cardLead)) continue;

        row.forEach(function (el) {
          if (el.classList.contains("is-visible")) return;
          el.style.removeProperty("--projects-row-delay");
          show(el);
        });
      }

      group.querySelectorAll(".page-projects__item.is-filtered-out").forEach(function (el) {
        hide(el);
        el.style.removeProperty("--projects-row-delay");
      });
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
    resetProjectBits();
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
