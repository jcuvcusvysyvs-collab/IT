(() => {
  const root = document.querySelector("[data-infra-scenarios]");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length || !panels.length) return;

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

    if (focus) nextTab.focus();
  };

  // Normalize: never use [hidden] — it breaks desktop equal-height stacking
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
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex < 0) return;
    event.preventDefault();
    activate(tabs[nextIndex], { focus: true });
  });
})();
