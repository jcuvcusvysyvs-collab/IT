/**
 * Виджет «Новости Москвы» (mos.ru) в футере.
 * Размер 200x200 — официальный вариант `#widget1`.
 * Нативной тёмной темы у виджета нет: в dark mode применяем CSS-filter.
 * Docs: https://www.mos.ru/widgets/citynews/
 */
(() => {
  const TARGET = "#widget1";
  const SIZE = "200x200";

  function mount() {
    if (typeof window.city_widget !== "function") return false;
    if (!document.querySelector(TARGET)) return false;
    window.city_widget(SIZE, TARGET);
    return true;
  }

  function load() {
    if (document.querySelector('script[data-mos-city-widget="1"]')) {
      const i = setInterval(() => {
        if (mount()) clearInterval(i);
      }, 50);
      setTimeout(() => clearInterval(i), 5000);
      return;
    }

    const js = document.createElement("script");
    js.src = "https://widgets.mos.ru/cnews/citywidgets.js";
    js.async = true;
    js.dataset.mosCityWidget = "1";
    document.head.appendChild(js);

    const i = setInterval(() => {
      if (document.readyState === "complete" && mount()) {
        clearInterval(i);
      }
    }, 50);
    setTimeout(() => clearInterval(i), 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, { once: true });
  } else {
    load();
  }
})();
