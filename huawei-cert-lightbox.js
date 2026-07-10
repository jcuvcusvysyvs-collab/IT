(function () {
  const dialog = document.getElementById("huawei-cert-lightbox");
  const lightboxImg = document.getElementById("huawei-cert-lightbox-img");
  if (!dialog || !lightboxImg) return;

  let priorFocus = null;

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
    priorFocus?.focus?.({ preventScroll: true });
  });
})();
