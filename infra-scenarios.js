(() => {
  const root = document.querySelector("[data-infra-scenarios]");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
  const strip = root.querySelector("[data-infra-tabs-strip]");
  const prev = root.querySelector("[data-infra-tabs-prev]");
  const next = root.querySelector("[data-infra-tabs-next]");
  const progress = root.querySelector("[data-infra-tabs-progress]");
  const progressFill = progress && progress.querySelector(".infra-scenarios__progress-fill");
  if (!tabs.length || !panels.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PROGRESS_MIN = 0.25;

  const activeIndex = () => tabs.findIndex((tab) => tab.classList.contains("is-active"));

  const setProgressByIndex = (index) => {
    const last = Math.max(1, tabs.length - 1);
    const ratio = tabs.length <= 1 ? 1 : Math.min(1, Math.max(0, index / last));
    const visual = PROGRESS_MIN + ratio * (1 - PROGRESS_MIN);
    const value = visual.toFixed(4);
    if (progress) progress.style.setProperty("--infra-tabs-scroll", value);
    if (progressFill) progressFill.style.transform = "scaleX(" + value + ")";
  };

  const updateArrowState = (index) => {
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= tabs.length - 1;
  };

  const scrollTabIntoView = (tab) => {
    if (!strip || !tab) return;

    const centerTab = () => {
      const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
      if (maxScroll <= 0) return;

      const index = tabs.indexOf(tab);
      let left;

      if (index <= 0) {
        left = 0;
      } else if (index >= tabs.length - 1) {
        left = maxScroll;
      } else {
        const stripRect = strip.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        const tabCenter =
          tabRect.left - stripRect.left + strip.scrollLeft + tabRect.width / 2;
        left = Math.max(0, Math.min(maxScroll, tabCenter - strip.clientWidth / 2));
      }

      if (Math.abs(strip.scrollLeft - left) < 1) return;
      strip.scrollTo({
        left,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    requestAnimationFrame(centerTab);
  };

  const activate = (nextTab, { focus = false } = {}) => {
    const id = nextTab.getAttribute("data-infra-tab");
    if (!id) return;

    tabs.forEach((tab) => {
      const on = tab === nextTab;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach((panel) => {
      const on = panel.getAttribute("data-infra-panel") === id;
      panel.classList.toggle("is-active", on);
      panel.setAttribute("aria-hidden", on ? "false" : "true");
      panel.removeAttribute("hidden");
    });

    const index = tabs.indexOf(nextTab);
    setProgressByIndex(index);
    updateArrowState(index);
    scrollTabIntoView(nextTab);

    if (focus) {
      try {
        nextTab.focus({ preventScroll: true });
      } catch {
        nextTab.focus();
      }
    }
  };

  const step = (dir) => {
    const index = activeIndex();
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= tabs.length) return;
    activate(tabs[nextIndex], { focus: true });
  };

  panels.forEach((panel) => {
    panel.removeAttribute("hidden");
    panel.setAttribute(
      "aria-hidden",
      panel.classList.contains("is-active") ? "false" : "true"
    );
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab));
  });

  root.querySelector('[role="tablist"]')?.addEventListener("keydown", (event) => {
    const current = document.activeElement;
    const index = tabs.indexOf(current);
    if (index < 0) return;

    let nextIndex = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = Math.min(tabs.length - 1, index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = Math.max(0, index - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex < 0 || nextIndex === index) return;
    event.preventDefault();
    activate(tabs[nextIndex], { focus: true });
  });

  if (prev) prev.addEventListener("click", () => step(-1));
  if (next) next.addEventListener("click", () => step(1));

  // Swipe on content panel also switches tabs (mobile)
  const stage = root.querySelector(".infra-scenarios__stage");
  const mobileMq = window.matchMedia("(max-width: 900px)");
  if (stage) {
    let touchX = null;
    stage.addEventListener(
      "touchstart",
      (event) => {
        if (!mobileMq.matches) return;
        touchX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      (event) => {
        if (!mobileMq.matches || touchX === null) return;
        const dx = event.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 56) return;
        step(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );
  }

  const initial = Math.max(0, activeIndex());
  setProgressByIndex(initial);
  updateArrowState(initial);
  scrollTabIntoView(tabs[initial]);
})();
