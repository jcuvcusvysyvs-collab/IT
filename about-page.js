(function () {
  var block = document.querySelector(".page-about__showcase .about-dce__block[data-about-reveal]");
  if (!block) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    block.classList.add("is-visible");
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

  observer.observe(block);
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
  var image = lightbox.querySelector(".page-about__cert-lightbox-img");
  var closeTargets = lightbox.querySelectorAll("[data-cert-lightbox-close]");
  var certTriggers = document.querySelectorAll("[data-about-cert-zoom]");

  function openLightbox(title, src, alt, certW, certH) {
    caption.textContent = title;
    image.src = src;
    image.alt = alt || title;
    image.style.setProperty("--cert-w", certW || "1000");
    image.style.setProperty("--cert-h", certH || "1420");
    lightbox.hidden = false;
    lockScroll();
    requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    lightbox.querySelector(".page-about__cert-lightbox-close").focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    unlockScroll();
    window.setTimeout(function () {
      if (!lightbox.classList.contains("is-open")) {
        lightbox.hidden = true;
        image.removeAttribute("src");
        image.style.removeProperty("--cert-w");
        image.style.removeProperty("--cert-h");
      }
    }, 240);
  }

  certTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openLightbox(
        trigger.getAttribute("data-cert-title") || "",
        trigger.getAttribute("data-cert-src") || "",
        trigger.querySelector("img") ? trigger.querySelector("img").alt : "",
        trigger.getAttribute("data-cert-w"),
        trigger.getAttribute("data-cert-h")
      );
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
