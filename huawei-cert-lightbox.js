(function () {
  const dialog = document.getElementById("huawei-cert-lightbox");
  const lightboxImg = document.getElementById("huawei-cert-lightbox-img");
  if (!dialog || !lightboxImg) return;

  let priorFocus = null;
  let lockedScrollY = 0;
  let scrollbarCompensation = 0;

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

  function openFromSource(sourceImg) {
    priorFocus = document.activeElement;
    lightboxImg.src = sourceImg.currentSrc || sourceImg.src;
    lightboxImg.alt = sourceImg.getAttribute("alt") || "Сертификат";
    if (sourceImg.srcset) {
      lightboxImg.srcset = sourceImg.srcset;
      if (sourceImg.sizes) lightboxImg.sizes = sourceImg.sizes;
    } else {
      lightboxImg.removeAttribute("srcset");
      lightboxImg.removeAttribute("sizes");
    }
    dialog.showModal();
    lockPageScroll();
    dialog.querySelector(".cert-lightbox__close")?.focus({ preventScroll: true });
  }

  const triggers = document.querySelectorAll(".huawei-cert-lightbox-trigger");

  triggers.forEach((trigger) => {
    const sourceImg = trigger.querySelector("img");
    if (!sourceImg || !sourceImg.getAttribute("src")) return;

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openFromSource(sourceImg);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFromSource(sourceImg);
      }
    });
  });

  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-cert-lightbox-close]")) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    unlockPageScroll();
    priorFocus?.focus?.({ preventScroll: true });
  });

  document.addEventListener("wheel", preventScrollWhileOpen, { passive: false });
  document.addEventListener("touchmove", preventScrollWhileOpen, { passive: false });
})();
