(function () {
  var MAP_COORDS = [55.781398, 37.583508];
  var MAP_ZOOM = 16;
  var mapInstance = null;

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function applyMapTheme() {
    var wrap = document.querySelector(".page-contacts__map-wrap");
    var canvas = document.getElementById("contacts-yandex-map");
    if (!wrap) return;

    var dark = isDarkTheme();
    wrap.setAttribute("data-map-theme", dark ? "dark" : "light");
    if (canvas) {
      canvas.classList.toggle("page-contacts__map-canvas--dark", dark);
    }
  }

  function initMap() {
    if (typeof ymaps === "undefined" || mapInstance) return;

    ymaps.ready(function () {
      var container = document.getElementById("contacts-yandex-map");
      if (!container) return;

      mapInstance = new ymaps.Map(
        container,
        {
          center: MAP_COORDS,
          zoom: MAP_ZOOM,
          controls: ["zoomControl"],
        },
        {
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
        }
      );

      mapInstance.geoObjects.add(
        new ymaps.Placemark(MAP_COORDS, {}, {
          preset: "islands#redDotIcon",
        })
      );

      applyMapTheme();
    });
  }

  function loadYandexMaps() {
    if (window.ymaps) {
      initMap();
      return;
    }

    if (document.getElementById("yandex-maps-api")) return;

    var script = document.createElement("script");
    script.id = "yandex-maps-api";
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }

  function watchTheme() {
    applyMapTheme();

    var themeSwitch = document.querySelector(".theme-switch-input");
    if (themeSwitch) {
      themeSwitch.addEventListener("change", applyMapTheme);
    }

    new MutationObserver(applyMapTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function init() {
    if (!document.getElementById("contacts-yandex-map")) return;
    watchTheme();
    loadYandexMaps();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
