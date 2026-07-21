(function () {
  const dialog = document.getElementById("huawei-cert-lightbox");
  const lightboxImg = document.getElementById("huawei-cert-lightbox-img");
  if (!dialog || !lightboxImg) return;

  const prevBtn = dialog.querySelector("[data-cert-lightbox-prev]");
  const nextBtn = dialog.querySelector("[data-cert-lightbox-next]");
  const counterEl = dialog.querySelector("[data-cert-lightbox-counter]");

  let priorFocus = null;
  let lockedScrollY = 0;
  let scrollbarCompensation = 0;
  let galleryItems = [];
  let galleryIndex = 0;
  let touchX = null;

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY;
    scrollbarCompensation = getScrollbarWidth();
    document.documentElement.classList.add("cert-lightbox-open");
    document.body.classList.add("cert-lightbox-open");

    if (scrollbarCompensation > 0) {
      document.body.style.paddingRight = scrollbarCompensation + "px";
    }

    window.scrollTo(0, lockedScrollY);
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("cert-lightbox-open");
    document.body.classList.remove("cert-lightbox-open");
    document.body.style.paddingRight = "";
    window.scrollTo(0, lockedScrollY);
  }

  function preventScrollWhileOpen(event) {
    if (!dialog.open) return;
    event.preventDefault();
  }

  function collectGallery(trigger) {
    const root = trigger.closest("[data-lightbox-gallery]");
    if (!root) return [];
    return Array.from(root.querySelectorAll(".huawei-cert-lightbox-trigger"))
      .map((el) => el.querySelector("img"))
      .filter((img) => img && img.getAttribute("src"));
  }

  function setImage(sourceImg) {
    lightboxImg.src = sourceImg.currentSrc || sourceImg.src;
    lightboxImg.alt = sourceImg.getAttribute("alt") || "Изображение";
    if (sourceImg.srcset) {
      lightboxImg.srcset = sourceImg.srcset;
      if (sourceImg.sizes) lightboxImg.sizes = sourceImg.sizes;
    } else {
      lightboxImg.removeAttribute("srcset");
      lightboxImg.removeAttribute("sizes");
    }

    lightboxImg.classList.remove("cert-lightbox__img--swap");
    void lightboxImg.offsetWidth;
    lightboxImg.classList.add("cert-lightbox__img--swap");
  }

  function updateGalleryChrome() {
    const hasGallery = galleryItems.length > 1;
    dialog.classList.toggle("cert-lightbox--gallery", hasGallery);

    if (prevBtn) {
      prevBtn.hidden = !hasGallery;
      prevBtn.disabled = !hasGallery;
    }
    if (nextBtn) {
      nextBtn.hidden = !hasGallery;
      nextBtn.disabled = !hasGallery;
    }
    if (counterEl) {
      if (hasGallery) {
        counterEl.hidden = false;
        counterEl.textContent = galleryIndex + 1 + " / " + galleryItems.length;
      } else {
        counterEl.hidden = true;
        counterEl.textContent = "";
      }
    }
  }

  function showGalleryIndex(index) {
    if (!galleryItems.length) return;
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    setImage(galleryItems[galleryIndex]);
    updateGalleryChrome();
  }

  function openFromSource(sourceImg, trigger) {
    priorFocus = document.activeElement;
    galleryItems = collectGallery(trigger);
    galleryIndex = Math.max(
      0,
      galleryItems.findIndex((img) => img === sourceImg || img.src === sourceImg.src)
    );
    if (!galleryItems.length) {
      galleryItems = [sourceImg];
      galleryIndex = 0;
    }

    setImage(galleryItems[galleryIndex]);
    updateGalleryChrome();
    dialog.showModal();
    lockPageScroll();
    dialog.querySelector(".cert-lightbox__close")?.focus({ preventScroll: true });
  }

  function step(delta) {
    if (galleryItems.length <= 1) return;
    showGalleryIndex(galleryIndex + delta);
  }

  const triggers = document.querySelectorAll(".huawei-cert-lightbox-trigger");

  triggers.forEach((trigger) => {
    const sourceImg = trigger.querySelector("img");
    if (!sourceImg || !sourceImg.getAttribute("src")) return;

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openFromSource(sourceImg, trigger);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFromSource(sourceImg, trigger);
      }
    });
  });

  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(-1);
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(1);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-cert-lightbox-close]")) {
      dialog.close();
    }
  });

  dialog.addEventListener("keydown", (e) => {
    if (!dialog.open) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  dialog.addEventListener(
    "touchstart",
    (e) => {
      if (!dialog.open || galleryItems.length <= 1) return;
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );

  dialog.addEventListener(
    "touchend",
    (e) => {
      if (!dialog.open || touchX === null || galleryItems.length <= 1) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      step(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );

  dialog.addEventListener("close", () => {
    galleryItems = [];
    galleryIndex = 0;
    updateGalleryChrome();
    unlockPageScroll();
    priorFocus?.focus?.({ preventScroll: true });
  });

  document.addEventListener("wheel", preventScrollWhileOpen, { passive: false });
  document.addEventListener("touchmove", preventScrollWhileOpen, { passive: false });
})();
