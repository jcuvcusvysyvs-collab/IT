/**
 * Footer rail — one sliding highlight per column (smooth between items).
 */
(() => {
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCE) return;

  function setupList(list) {
    if (!list || list.dataset.railReady) return;
    list.dataset.railReady = "1";
    list.classList.add("footer-list--rail");

    const tip = document.createElement("span");
    tip.className = "footer-rail-tip";
    tip.setAttribute("aria-hidden", "true");
    list.appendChild(tip);

    const items = [...list.querySelectorAll(":scope > li")].filter((li) =>
      li.querySelector("a, .footer-contact-item__value:not(.footer-contact-item__value--text)")
    );

    function moveTo(li) {
      if (!li) {
        tip.classList.remove("is-on");
        return;
      }

      const listRect = list.getBoundingClientRect();
      const rowRect = li.getBoundingClientRect();
      const top = rowRect.top - listRect.top + list.scrollTop;
      const height = rowRect.height;
      const wasOn = tip.classList.contains("is-on");

      if (!wasOn) {
        tip.style.transition = "none";
        tip.style.top = top + "px";
        tip.style.height = height + "px";
        // force reflow, then fade in with normal transition
        void tip.offsetHeight;
        tip.style.transition = "";
        tip.classList.add("is-on");
        return;
      }

      tip.style.top = top + "px";
      tip.style.height = height + "px";
      tip.classList.add("is-on");
    }

    items.forEach((li) => {
      li.addEventListener("mouseenter", () => moveTo(li));
      li.addEventListener("focusin", () => moveTo(li));
    });

    list.addEventListener("mouseleave", () => moveTo(null));
    list.addEventListener("focusout", (e) => {
      if (!list.contains(e.relatedTarget)) moveTo(null);
    });
  }

  function boot() {
    document
      .querySelectorAll(".footer-nav-list, .footer-contact-list")
      .forEach(setupList);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
