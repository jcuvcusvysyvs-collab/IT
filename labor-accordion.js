(function () {
  "use strict";

  var container = document.querySelector(".page-labor__groups");
  if (!container) return;

  var groups = container.querySelectorAll(".page-labor__group");
  if (!groups.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var transitionMs = 320;

  function setExpanded(details, summary, expanded) {
    details.classList.toggle("is-expanded", expanded);
    summary.setAttribute("aria-expanded", expanded ? "true" : "false");

    if (expanded) {
      details.setAttribute("open", "");
      return;
    }

    details.removeAttribute("open");
  }

  groups.forEach(function (details) {
    var summary = details.querySelector(".page-labor__group-toggle");
    var body = details.querySelector(".page-labor__group-body");
    if (!summary || !body) return;

    setExpanded(details, summary, details.hasAttribute("open"));

    summary.addEventListener("click", function (event) {
      event.preventDefault();

      var isExpanded = details.classList.contains("is-expanded");

      if (reduceMotion) {
        setExpanded(details, summary, !isExpanded);
        return;
      }

      if (isExpanded) {
        details.classList.remove("is-expanded");

        var finished = false;
        function finishClose() {
          if (finished) return;
          finished = true;
          body.removeEventListener("transitionend", onTransitionEnd);
          summary.setAttribute("aria-expanded", "false");
          details.removeAttribute("open");
        }

        function onTransitionEnd(evt) {
          if (evt.target !== body || evt.propertyName !== "grid-template-rows") return;
          finishClose();
        }

        body.addEventListener("transitionend", onTransitionEnd);
        window.setTimeout(finishClose, transitionMs + 80);
        return;
      }

      details.setAttribute("open", "");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          details.classList.add("is-expanded");
          summary.setAttribute("aria-expanded", "true");
        });
      });
    });
  });

  container.setAttribute("data-labor-accordion-ready", "");
})();
