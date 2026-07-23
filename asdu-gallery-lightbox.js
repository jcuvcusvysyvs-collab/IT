(function () {
  var lightbox = document.getElementById("asdu-gallery-lightbox");
  if (!lightbox) return;

  var caption = lightbox.querySelector(".page-asdu__lightbox-caption");
  var img = lightbox.querySelector(".page-asdu__lightbox-img");
  var counter = lightbox.querySelector(".page-asdu__lightbox-counter");
  var prevBtn = lightbox.querySelector("[data-asdu-lightbox-prev]");
  var nextBtn = lightbox.querySelector("[data-asdu-lightbox-next]");
  var closeTargets = lightbox.querySelectorAll("[data-asdu-lightbox-close]");
  var openAllBtn = document.querySelector("[data-asdu-gallery-open-all]");
  var countEl = document.querySelector("[data-asdu-gallery-count]");
  var triggers = Array.prototype.slice.call(
    document.querySelectorAll("[data-asdu-gallery-zoom]")
  );

  if (!img || !triggers.length) return;

  var items = [];
  var index = 0;
  var touchX = null;
  var openCount = 0;

  if (countEl) {
    countEl.textContent = String(triggers.length);
  }
  if (openAllBtn) {
    openAllBtn.setAttribute(
      "aria-label",
      "Смотреть все фото галереи, " + triggers.length + " шт."
    );
  }

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

  function collectItems() {
    return triggers
      .map(function (trigger) {
        var source = trigger.querySelector("img");
        if (!source || !source.getAttribute("src")) return null;
        var figure = trigger.closest(".page-asdu__gallery-item");
        var titleNode = figure && figure.querySelector(".page-asdu__gallery-caption");
        return {
          trigger: trigger,
          src: source.currentSrc || source.src,
          alt: source.getAttribute("alt") || "",
          title: titleNode ? titleNode.textContent.trim() : "",
          w: source.getAttribute("width") || "1920",
          h: source.getAttribute("height") || "1080",
        };
      })
      .filter(Boolean);
  }

  function showItem(nextIndex) {
    if (!items.length) return;
    index = (nextIndex + items.length) % items.length;
    var item = items[index];

    img.src = item.src;
    img.alt = item.alt;
    img.style.setProperty("--asdu-lb-w", item.w);
    img.style.setProperty("--asdu-lb-h", item.h);

    if (caption) caption.textContent = item.title || item.alt || "";
    if (counter) {
      counter.hidden = items.length <= 1;
      counter.textContent = index + 1 + " / " + items.length;
    }

    var hasNav = items.length > 1;
    if (prevBtn) prevBtn.hidden = !hasNav;
    if (nextBtn) nextBtn.hidden = !hasNav;
  }

  function openAt(startIndex) {
    items = collectItems();
    if (!items.length) return;
    showItem(startIndex);
    lightbox.hidden = false;
    lockScroll();
    requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    var closeBtn = lightbox.querySelector(".page-asdu__lightbox-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    unlockScroll();
    window.setTimeout(function () {
      if (!lightbox.classList.contains("is-open")) {
        lightbox.hidden = true;
        img.removeAttribute("src");
        img.alt = "";
      }
    }, 240);
  }

  function step(delta) {
    if (items.length <= 1) return;
    showItem(index + delta);
  }

  triggers.forEach(function (trigger, triggerIndex) {
    trigger.addEventListener("click", function () {
      openAt(triggerIndex);
    });
  });

  if (openAllBtn) {
    openAllBtn.addEventListener("click", function () {
      openAt(0);
    });
  }

  closeTargets.forEach(function (node) {
    node.addEventListener("click", closeLightbox);
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      step(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      step(1);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  });

  lightbox.addEventListener(
    "touchstart",
    function (event) {
      if (!lightbox.classList.contains("is-open") || items.length <= 1) return;
      touchX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    function (event) {
      if (!lightbox.classList.contains("is-open") || touchX === null || items.length <= 1) {
        return;
      }
      var dx = event.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      step(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
})();
