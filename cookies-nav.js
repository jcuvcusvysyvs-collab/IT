(function () {
  "use strict";

  var links = Array.prototype.slice.call(
    document.querySelectorAll("[data-cookies-toc]")
  );
  if (!links.length) return;

  var seen = Object.create(null);
  var sections = [];
  links.forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace(/^#/, "");
    if (!id || seen[id]) return;
    var el = document.getElementById(id);
    if (!el) return;
    seen[id] = true;
    sections.push(el);
  });

  if (!sections.length) return;

  var activeId = null;
  var ticking = false;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    links.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
      if (match) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function updateActive() {
    var rootStyles = getComputedStyle(document.documentElement);
    var headerOffset =
      parseFloat(rootStyles.getPropertyValue("--site-header-height")) || 88;
    var subnavOffset =
      parseFloat(rootStyles.getPropertyValue("--section-subnav-height")) || 0;
    var probe = window.scrollY + headerOffset + subnavOffset + 28;
    var current = sections[0].id;

    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].getBoundingClientRect().top + window.scrollY;
      if (top <= probe) current = sections[i].id;
    }

    setActive(current);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      updateActive();
    });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var id = (link.getAttribute("href") || "").replace(/^#/, "");
      if (id) setActive(id);
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateActive();
})();
