(function () {
  var blocks = document.querySelectorAll(".page-about .about-dce__block[data-about-reveal]");
  if (!blocks.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    blocks.forEach(function (block) {
      block.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
  );

  blocks.forEach(function (block) {
    observer.observe(block);
  });
})();

(function () {
  var openCount = 0;

  function lockScroll() {
    if (openCount === 0) {
      document.documentElement.classList.add("sw-detail-open");
    }
    openCount += 1;
  }

  function unlockScroll() {
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      document.documentElement.classList.remove("sw-detail-open");
    }
  }

  var triggers = document.querySelectorAll("[data-sw-detail-open]");
  triggers.forEach(function (trigger) {
    var detailId = trigger.getAttribute("aria-controls") || "sw-detail-" + trigger.getAttribute("data-sw-detail-open");
    var detail = document.getElementById(detailId);
    if (!detail) return;

    var card = trigger.closest(".page-about__sw-card");
    var closeTargets = detail.querySelectorAll("[data-sw-detail-close]");

    function openDetail() {
      detail.hidden = false;
      lockScroll();
      requestAnimationFrame(function () {
        detail.classList.add("is-open");
      });
      trigger.setAttribute("aria-expanded", "true");
      if (card) card.classList.add("is-active");
    }

    function closeDetail() {
      detail.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (card) card.classList.remove("is-active");
      unlockScroll();

      window.setTimeout(function () {
        if (!detail.classList.contains("is-open")) {
          detail.hidden = true;
        }
      }, 280);
    }

    trigger.addEventListener("click", openDetail);

    closeTargets.forEach(function (node) {
      node.addEventListener("click", closeDetail);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && detail.classList.contains("is-open")) {
        closeDetail();
        trigger.focus();
      }
    });
  });

  var lightbox = document.getElementById("about-cert-lightbox");
  if (!lightbox) return;

  var caption = lightbox.querySelector(".page-about__cert-lightbox-caption");
  var pagesRoot = document.getElementById("about-cert-lightbox-pages");
  var closeTargets = lightbox.querySelectorAll("[data-cert-lightbox-close]");
  var certTriggers = document.querySelectorAll("[data-about-cert-zoom]");

  if (!pagesRoot) return;

  function parsePages(trigger) {
    var pagesJson = trigger.getAttribute("data-cert-pages");
    if (pagesJson) {
      try {
        var parsed = JSON.parse(pagesJson);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (error) {
        /* fall through to single-page mode */
      }
    }

    return [
      {
        src: trigger.getAttribute("data-cert-src") || "",
        w: trigger.getAttribute("data-cert-w") || "1000",
        h: trigger.getAttribute("data-cert-h") || "1420",
        alt: trigger.querySelector("img") ? trigger.querySelector("img").alt : "",
      },
    ];
  }

  function renderPages(pages) {
    pagesRoot.innerHTML = "";

    pages.forEach(function (page, index) {
      var figure = document.createElement("figure");
      figure.className = "page-about__cert-lightbox-page";

      if (pages.length > 1 && page.label) {
        var label = document.createElement("p");
        label.className = "page-about__cert-lightbox-page-label";
        label.textContent = page.label;
        figure.appendChild(label);
      }

      var img = document.createElement("img");
      img.className = "page-about__cert-lightbox-img";
      img.src = page.src;
      img.alt = page.alt || "";
      img.style.setProperty("--cert-w", page.w || "1000");
      img.style.setProperty("--cert-h", page.h || "1420");
      if (index > 0) img.loading = "lazy";
      figure.appendChild(img);
      pagesRoot.appendChild(figure);
    });
  }

  function openLightbox(title, pages) {
    caption.textContent = title;
    renderPages(pages);
    lightbox.classList.toggle("page-about__cert-lightbox--multi", pages.length > 1);
    lightbox.hidden = false;
    lockScroll();
    requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    pagesRoot.scrollTop = 0;
    lightbox.querySelector(".page-about__cert-lightbox-close").focus({ preventScroll: true });
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.classList.remove("page-about__cert-lightbox--multi");
    unlockScroll();
    window.setTimeout(function () {
      if (!lightbox.classList.contains("is-open")) {
        lightbox.hidden = true;
        pagesRoot.innerHTML = "";
      }
    }, 240);
  }

  certTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openLightbox(trigger.getAttribute("data-cert-title") || "", parsePages(trigger));
    });
  });

  closeTargets.forEach(function (node) {
    node.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
})();

(function () {
  var grid = document.querySelector(".about-expertise__grid");
  if (!grid) return;

  var nums = grid.querySelectorAll(".about-expertise__stat-num[data-count]");
  if (!nums.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function valueAt(t, target) {
    var tail = Math.min(10, target);
    var head = target - tail;

    // Большая часть времени — на последние 10 чисел
    var split = head <= 0 ? 0 : 0.36;

    if (head > 0 && t < split) {
      return head * easeInOutCubic(t / split);
    }

    var u = split >= 1 ? 1 : (t - split) / (1 - split);
    // Почти линейно по хвосту, лёгкое торможение в самом конце
    var eased = u * 0.78 + (1 - Math.pow(1 - u, 2)) * 0.22;
    return head + tail * eased;
  }

  function formatValue(value, target) {
    var n = Math.round(value);
    if (n >= target) return String(target);
    var digits = String(target).length;
    return String(n).padStart(Math.max(2, digits), "0");
  }

  function setFinal(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!isFinite(target)) return;
    el.textContent = String(target);
  }

  function animateAll() {
    nums.forEach(function (el, index) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (!isFinite(target)) return;

      el.textContent = formatValue(0, target);

      window.setTimeout(function () {
        var started = null;
        var duration = 2300 + Math.min(target, 300) * 2.3;

        function frame(now) {
          if (started === null) started = now;
          var t = Math.min(1, (now - started) / duration);
          el.textContent = formatValue(valueAt(t, target), target);
          if (t < 1) {
            window.requestAnimationFrame(frame);
          } else {
            setFinal(el);
          }
        }

        window.requestAnimationFrame(frame);
      }, 90 * index);
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    nums.forEach(setFinal);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animateAll();
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.2 }
  );

  observer.observe(grid);
})();
