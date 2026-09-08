/* Homepage geo map — data from home-geo-data.js (window.HOME_GEO_DATA) */
(function () {
  var root = document.querySelector(".home-geo");
  if (!root) return;

  var listEl = root.querySelector("[data-geo-logos]");
  var cardEl = root.querySelector("[data-geo-card]");
  var mapEl = root.querySelector(".home-geo__map");
  var pinsHost = root.querySelector("[data-geo-pins]");
  if (!listEl || !cardEl || !mapEl || !pinsHost) return;

  var nameEl = cardEl.querySelector("[data-geo-card-name]");
  var metaEl = cardEl.querySelector("[data-geo-card-meta]");
  var metaSepEl = cardEl.querySelector("[data-geo-card-meta-sep]");
  var cityEl = cardEl.querySelector("[data-geo-card-city]");
  var descEl = cardEl.querySelector("[data-geo-card-desc]");
  var yearEl = cardEl.querySelector("[data-geo-card-year]");
  var countEl = cardEl.querySelector("[data-geo-card-count]");
  var navEl = cardEl.querySelector("[data-geo-card-nav]");
  var prevBtn = cardEl.querySelector("[data-geo-card-prev]");
  var nextBtn = cardEl.querySelector("[data-geo-card-next]");
  var bodyEl = cardEl.querySelector("[data-geo-card-body]");
  var linkEl = cardEl.querySelector("[data-geo-card-link]");
  var logoLightEl = cardEl.querySelector("[data-geo-card-logo-light]");
  var logoDarkEl = cardEl.querySelector("[data-geo-card-logo-dark]");
  var closeBtn = cardEl.querySelector("[data-geo-card-close]");

  var DATA = [];
  var CITY_PINS = [];
  var pins = [];

  var activeItem = null;
  var activeIndex = 0;
  var activeTrigger = null;
  var closeTimer = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function projectCountByCity() {
    var counts = Object.create(null);
    DATA.forEach(function (item) {
      item.projects.forEach(function (project) {
        var cities = project.cities && project.cities.length ? project.cities : item.cities;
        cities.forEach(function (city) {
          counts[city] = (counts[city] || 0) + 1;
        });
      });
    });
    return counts;
  }

  function projectWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "проект";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "проекта";
    return "проектов";
  }

  function pinSizeClass(count) {
    if (count >= 10) return "home-geo__pin--lg";
    if (count >= 2) return "home-geo__pin--md";
    return "home-geo__pin--sm";
  }

  function buildPins() {
    var counts = projectCountByCity();
    pinsHost.innerHTML = CITY_PINS.map(function (entry) {
      var count = counts[entry.city] || 0;
      var sizeClass = pinSizeClass(count);
      var aria =
        count > 0
          ? entry.city + ": " + count + " " + projectWord(count)
          : entry.city;
      return (
        '<button type="button" class="home-geo__pin ' +
        sizeClass +
        '" style="left:' +
        entry.x +
        "%;top:" +
        entry.y +
        '%" data-city="' +
        escapeHtml(entry.city) +
        '" data-count="' +
        count +
        '" aria-label="' +
        escapeHtml(aria) +
        '">' +
        '<span class="home-geo__pin-dot" aria-hidden="true"></span>' +
        '<span class="home-geo__pin-label">' +
        escapeHtml(entry.city) +
        "</span>" +
        "</button>"
      );
    }).join("");
    pins = Array.prototype.slice.call(pinsHost.querySelectorAll(".home-geo__pin"));
  }

  function buildLogos() {
    listEl.innerHTML = DATA.map(function (item) {
      return (
        "<li>" +
        '<button type="button" class="home-geo__logo-card" data-geo-id="' +
        escapeHtml(item.id) +
        '" aria-pressed="false" aria-label="' +
        escapeHtml(item.client) +
        '">' +
        '<span class="home-geo__logo-media">' +
        '<img class="home-geo__logo-img home-geo__logo-img--light" src="' +
        escapeHtml(item.logo) +
        '" alt="" width="160" height="64" loading="lazy" decoding="async" />' +
        '<img class="home-geo__logo-img home-geo__logo-img--dark" src="' +
        escapeHtml(item.logoDark) +
        '" alt="" width="160" height="64" loading="lazy" decoding="async" />' +
        "</span>" +
        "</button>" +
        "</li>"
      );
    }).join("");
  }

  function pinsForCities(cities) {
    return pins.filter(function (pin) {
      return cities.indexOf(pin.getAttribute("data-city")) !== -1;
    });
  }

  function highlightCities(cities) {
    var matched = pinsForCities(cities);
    if (!matched.length) matched = pinsForCities(activeItem ? activeItem.cities : []);
    pins.forEach(function (pin) {
      pin.classList.toggle("is-active", matched.indexOf(pin) !== -1);
    });
    mapEl.classList.add("is-filtered");
    return matched[0] || null;
  }

  function clearHighlight() {
    activeItem = null;
    activeIndex = 0;
    activeTrigger = null;
    pins.forEach(function (pin) {
      pin.classList.remove("is-active");
    });
    mapEl.classList.remove("is-filtered");
    listEl.querySelectorAll(".home-geo__logo-card").forEach(function (btn) {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-pressed", "false");
    });
    root.classList.remove("is-card-open");
    hideCard();
  }

  function hideCard() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    cardEl.classList.remove("is-open");
    cardEl.classList.add("is-closing");
    cardEl.setAttribute("aria-hidden", "true");

    var finish = function () {
      cardEl.hidden = true;
      cardEl.classList.remove("is-closing");
      cardEl.style.left = "";
      cardEl.style.top = "";
      cardEl.style.width = "";
      cardEl.style.transformOrigin = "";
      closeTimer = null;
    };

    closeTimer = setTimeout(finish, 260);
  }

  function setCardOriginFromPin(anchorPin, left, top) {
    var mapBox = mapEl.getBoundingClientRect();
    var pinBox = anchorPin.getBoundingClientRect();
    var pinCx = pinBox.left + pinBox.width / 2 - mapBox.left;
    var pinCy = pinBox.top + pinBox.height / 2 - mapBox.top;
    var ox = Math.round(pinCx - left);
    var oy = Math.round(pinCy - top);
    cardEl.style.transformOrigin = ox + "px " + oy + "px";
  }

  function showCard(playOpenAnim) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    cardEl.hidden = false;
    cardEl.classList.remove("is-closing");
    cardEl.setAttribute("aria-hidden", "false");

    if (playOpenAnim) {
      cardEl.classList.remove("is-open");
      void cardEl.offsetWidth;
    }
    cardEl.classList.add("is-open");
  }

  function placeCard(anchorPin) {
    if (!anchorPin) return;
    var mapBox = mapEl.getBoundingClientRect();
    var pinBox = anchorPin.getBoundingClientRect();
    var cardW = Math.min(360, mapBox.width - 32);
    var wasOpen = cardEl.classList.contains("is-open") && !cardEl.hidden;

    cardEl.style.width = cardW + "px";
    cardEl.hidden = false;
    var cardH = cardEl.offsetHeight;

    var left = pinBox.right - mapBox.left + 16;
    var top = pinBox.top - mapBox.top - cardH / 2 + pinBox.height / 2;

    if (left + cardW > mapBox.width - 16) {
      left = pinBox.left - mapBox.left - cardW - 16;
    }
    if (left < 16) left = 16;
    if (top < 16) top = 16;
    if (top + cardH > mapBox.height - 16) {
      top = Math.max(16, mapBox.height - cardH - 16);
    }

    cardEl.style.left = left + "px";
    cardEl.style.top = top + "px";
    setCardOriginFromPin(anchorPin, left, top);
    showCard(!wasOpen);
  }

  function setLogo(img, src, fallback) {
    img.onerror = function () {
      img.onerror = null;
      if (fallback && img.src.indexOf(fallback) === -1) img.src = fallback;
    };
    img.src = src;
  }

  function currentProject() {
    if (!activeItem) return null;
    return activeItem.projects[activeIndex] || activeItem.projects[0];
  }

  function renderSlide(animate) {
    var project = currentProject();
    if (!project) return;

    if (animate && bodyEl) {
      bodyEl.classList.remove("is-swap");
      void bodyEl.offsetWidth;
      bodyEl.classList.add("is-swap");
    }

    var cities =
      project.cities && project.cities.length ? project.cities : activeItem.cities;
    var cityText = cities && cities.length ? cities.join(", ") : "";
    var year = project.year && project.year !== "—" ? project.year : "";

    if (cityEl) cityEl.textContent = cityText;
    if (yearEl) {
      yearEl.textContent = year;
      yearEl.hidden = !year;
    }
    if (metaSepEl) metaSepEl.hidden = !(cityText && year);
    if (metaEl) metaEl.hidden = !(cityText || year);

    nameEl.textContent = activeItem.client;
    descEl.textContent = project.desc;

    linkEl.href = project.href || "projects.html#projects-all";
    setLogo(logoLightEl, activeItem.logo, activeItem.logo);
    setLogo(logoDarkEl, activeItem.logoDark, activeItem.logo);

    var total = activeItem.projects.length;
    var multi = total > 1;
    navEl.hidden = !multi;
    if (countEl) {
      countEl.textContent = multi ? activeIndex + 1 + " / " + total : "";
    }
    if (prevBtn) prevBtn.disabled = !multi;
    if (nextBtn) nextBtn.disabled = !multi;

    var pin = highlightCities(cities);
    placeCard(pin);
  }

  function openItem(item, trigger, startIndex) {
    var matched = pinsForCities(item.cities);
    if (!matched.length) return;

    activeItem = item;
    activeIndex = startIndex || 0;
    activeTrigger = trigger || null;

    listEl.querySelectorAll(".home-geo__logo-card").forEach(function (btn) {
      var on = trigger ? btn === trigger : btn.getAttribute("data-geo-id") === item.id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    root.classList.add("is-card-open");
    renderSlide(false);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function step(delta) {
    if (!activeItem || activeItem.projects.length < 2) return;
    var total = activeItem.projects.length;
    activeIndex = (activeIndex + delta + total) % total;
    renderSlide(true);
  }

  function findById(id) {
    return DATA.filter(function (entry) {
      return entry.id === id;
    })[0];
  }

  function bindEvents() {
    listEl.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-geo-id]");
      if (!btn) return;
      var item = findById(btn.getAttribute("data-geo-id"));
      if (!item) return;
      if (btn.classList.contains("is-active")) {
        clearHighlight();
        return;
      }
      openItem(item, btn, 0);
    });

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () {
        var city = pin.getAttribute("data-city");
        var item = DATA.filter(function (entry) {
          return entry.cities.indexOf(city) !== -1;
        })[0];
        if (!item) return;
        var trigger = listEl.querySelector('[data-geo-id="' + item.id + '"]');
        var start = 0;
        item.projects.forEach(function (project, index) {
          if (project.cities && project.cities.indexOf(city) !== -1 && start === 0) {
            start = index;
          }
        });
        openItem(item, trigger, start);
      });
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

    if (closeBtn) {
      closeBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        clearHighlight();
      });
    }

    cardEl.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    document.addEventListener("pointerdown", function (event) {
      if (!root.classList.contains("is-card-open")) return;
      var target = event.target;
      if (cardEl.contains(target)) return;
      if (target.closest && target.closest("[data-geo-id]")) return;
      if (target.closest && target.closest(".home-geo__pin")) return;
      clearHighlight();
    });

    document.addEventListener("keydown", function (event) {
      if (!root.classList.contains("is-card-open")) return;
      if (event.key === "Escape") clearHighlight();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    window.addEventListener("resize", function () {
      if (!root.classList.contains("is-card-open")) return;
      var active = root.querySelector(".home-geo__pin.is-active");
      if (active) placeCard(active);
    });
  }

  function init(payload) {
    DATA = payload.clients || [];
    CITY_PINS = payload.pins || [];
    buildPins();
    buildLogos();
    bindEvents();
  }

  var payload = window.HOME_GEO_DATA;
  if (!payload || !payload.clients || !payload.pins) {
    if (typeof console !== "undefined" && console.error) {
      console.error(
        "[home-geo] Нет window.HOME_GEO_DATA. Подключите home-geo-data.js перед home-geo.js."
      );
    }
    return;
  }
  init(payload);
})();
