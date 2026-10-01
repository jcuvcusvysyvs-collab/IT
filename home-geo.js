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
  var searchEl = root.querySelector("[data-geo-search]");
  var sortEl = root.querySelector("[data-geo-sort]");
  var emptyEl = root.querySelector("[data-geo-logos-empty]");

  var DATA = [];
  var CITY_PINS = [];
  var pins = [];

  var activeItem = null;
  var logoScrollToken = 0;
  var activeQueue = [];
  var activeIndex = 0;
  var anchorCity = null;
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
    if (count <= 0) return "home-geo__pin--empty";
    if (count >= 10) return "home-geo__pin--lg";
    if (count >= 2) return "home-geo__pin--md";
    return "home-geo__pin--sm";
  }

  function buildPins() {
    var counts = projectCountByCity();
    pinsHost.innerHTML = CITY_PINS.map(function (entry) {
      var count = counts[entry.city] || 0;
      var sizeClass = pinSizeClass(count);
      var clickable = count > 0;
      var aria = clickable
        ? entry.city + ": " + count + " " + projectWord(count)
        : entry.city + ", нет проектов";
      var tag = clickable ? "button" : "span";
      var typeAttr = clickable ? ' type="button"' : "";
      return (
        "<" +
        tag +
        typeAttr +
        ' class="home-geo__pin ' +
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
        "</" +
        tag +
        ">"
      );
    }).join("");
    pins = Array.prototype.slice.call(pinsHost.querySelectorAll(".home-geo__pin"));
  }

  function clientFreshness(item) {
    return item.projects.reduce(function (max, project) {
      return Math.max(max, yearKey(project));
    }, 0);
  }

  function sortedClients() {
    var activeSort = sortEl ? sortEl.querySelector('[aria-pressed="true"]') : null;
    var mode = activeSort ? activeSort.getAttribute("data-sort") : "fresh";
    var list = DATA.slice();
    list.sort(function (a, b) {
      if (mode === "alpha") return a.client.localeCompare(b.client, "ru");
      var byYear = clientFreshness(b) - clientFreshness(a);
      if (mode === "old") byYear = -byYear;
      if (byYear) return byYear;
      return a.client.localeCompare(b.client, "ru");
    });
    return list;
  }

  function logoMarkup(item) {
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
  }

  function buildLogos() {
    var activeId = activeItem ? activeItem.id : "";
    listEl.innerHTML = sortedClients().map(logoMarkup).join("");
    if (activeId) {
      var activeBtn = listEl.querySelector('[data-geo-id="' + activeId + '"]');
      if (activeBtn) {
        activeBtn.classList.add("is-active");
        activeBtn.setAttribute("aria-pressed", "true");
      }
    }
    applyLogoSearch();
  }

  var CLIENT_SEARCH_ALIASES = {
    "ЗАО «Татфондбанк»": ["ТФБ", "ЗАО ТФБ"],
    "Московский городской фонд обязательного медицинского страхования": ["МГФОМС", "ГУ МГФОМС"],
    "АО «НПФ Сбербанка»": ["Акционерное общество «Негосударственный Пенсионный Фонд Сбербанка»", "СберНПФ"],
    "ГБУ Финансово-хозяйственное управление Мэрии Москвы": ["ГБУ «ФХУ»", "Государственное бюджетное учреждение города Москвы «Финансово-хозяйственное управление»"],
    "Правительство Москвы": ["Мэрия", "Портал Мэра и Правительства Москвы", "Мос.ру"],
    "ЗАО «Америабанк»": ["Закрытое Акционерное Общество «Америабанк»"],
    "ГУП «Мосгортранс»": ["Государственное унитарное предприятие города Москвы «Мосгортранс»"],
    "ООО «ИНВИТРО»": ["Общество с ограниченной ответственностью «Независимая лаборатория ИНВИТРО»", "ООО «Независимая лаборатория ИНВИТРО»"],
    "ФАУ «Главгосэкспертиза России»": ["Федеральное автономное учреждение «Главное управление государственной экспертизы»", "ФАУ «Главное управление государственной экспертизы»"],
    "Медиаскоп": ["АО «Медиаскоп»", "Акционерное общество «Медиаскоп»"],
    "Фонд социального страхования РФ": ["Фонд пенсионного и социального страхования Российской Федерации", "Социальный фонд России", "СФР"],
    "РТК Цифровые технологии": ["ООО «РТК ЦТ»", "Общество с ограниченной ответственностью «РТК Цифровые Технологии»"],
    "ОДК «Авиадвигатель»": ["АО «ОДК-Авиадвигатель»", "Акционерное общество «ОДК-Авиадвигатель»", "ОДК"],
    "ООО «ИТЛ ГРУПП»": ["ИТЛ"],
    "ООО «Системный софт»": ["софт"],
    "ООО «Кунатек»": ["кунатек"],
    "АО «Банк ДОМ.РФ», АО «ДОМ.РФ»": ["Акционерное общество «Банк ДОМ.РФ»"],
    "Пенсионный фонд Российской Федерации": ["Фонд пенсионного и социального страхования Российской Федерации", "Социальный фонд России", "СФР", "ПФР", "Пенсионный фонд Российской Федерации"],
    "ГБУЗ ОТ «Медицинский информационно-аналитический центр» Владимирской области": ["ГБУЗ ВО «МИАЦ»", "ГБУЗ ОТ «МИАЦ» Владимирской области"],
    "Банк России": ["ЦБ"],
    "ГУП «Москоллектор»": ["Государственное унитарное предприятие города Москвы по эксплуатации коммуникационных коллекторов «Москоллектор»"],
    "АО «Мосводоканал»": ["Акционерное общество «Мосводоканал»"],
    "ДИТ Москвы": ["Департамент информационных технологий города Москвы", "Департамент Информационных Технологий Города Москвы"],
    "ФГБУ «НМИЦ ТО им. Н.Н. Приорова»": ["ФГБУ «НМИЦ ТО им. Н.Н. Приорова» Минздрава России", "Федеральное государственное бюджетное учреждение «Национальный медицинский исследовательский центр травматологии и ортопедии имени Н.Н. Приорова» Министерства здравоохранения Российской Федерации"],
    "ФГБУ «НЦЭСМП» Минздрава России": ["федеральное государственное бюджетное учреждение «Научный центр экспертизы средств медицинского применения» Министерства здравоохранения Российской Федерации"],
    "ФКУ «Росдоринформсвязь»": ["Федеральное казенное учреждение «Информационно-аналитический центр Федерального дорожного агентства»", "Росавтодор"],
    "Министерство энергетики Российской Федерации": ["Минэнерго России", "МЭ РФ"],
    "ГБУ «Мосгоргеотрест»": ["МГГТ", "Государственное бюджетное учреждение города Москвы «Московский городской трест геолого-геодезических и картографических работ»"],
    "ПАО «Россети Московский регион»": ["Публичное акционерное общество «Россети Московский регион»", "ПАО «Россети МР»"],
    "ПАО БАНК ВТБ": ["банк"],
    "ФГОБУ ВО «Финансовый университет при Правительстве Российской Федерации»": ["Финансовый университет", "Финуниверситет", "ФГОБУ ВО «Финансовый университет при Правительстве Российской Федерации»", "МФИ", "Московский финансовый институт"],
    "Росфинмониторинг": ["Федеральная служба по финансовому мониторингу", "ФСФМ"],
    "ПАО «Россети Урал»": ["Публичное акционерное общество «Россети Урал»", "ПАО «МРСК Урала»"],
    "ПАО «Саратовский НПЗ»": ["Публичное акционерное общество «Саратовский нефтеперерабатывающий завод»", "СНПЗ"],
    "ФГБУ «РГБ»": ["Федеральное государственное бюджетное учреждение «Российская государственная библиотека»", "библиотека", "Российская государственная библиотека", "Библиотека им. В. И. Ленина"],
    "АО «СО ЕЭС»": ["Акционерное общество «Системный оператор Единой энергетической системы»", "АО «Системный оператор Единой энергетической системы»"],
    "ООО «ОТР-БИТ»": ["Общество с ограниченной ответственностью «ОТР-Безопасность Информационных Технологий»"],
    "АО «РНПК»": ["Акционерное общество «Рязанская нефтеперерабатывающая компания»", "Рязанский нефтеперерабатывающий завод", "РНПЗ"],
    "АО «Тандер»": ["магнит", "Акционерное общество «Тандер»", "ПАО «Магнит»"],
    "ООО «ГПМ РТВ»": ["ООО «ГПМ Развлекательное телевидение»", "«Газпром-Медиа Развлекательное телевидение»", "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ГПМ РАЗВЛЕКАТЕЛЬНОЕ ТЕЛЕВИДЕНИЕ»"],
    "АО «ТНТ-Телесеть»": ["Акционерное общество «ТНТ-Телесеть»", "«Твоё новое телевидение»", "ТНТ"],
    "ПАО АКБ «ПЕРЕСВЕТ»": ["банк пересвет", "Акционерный коммерческий банк «ПЕРЕСВЕТ»"],
    "ФГУП ГлавУпДК при МИД России": ["Федеральное государственное унитарное предприятие «Главное производственно-коммерческое управление по обслуживанию дипломатического корпуса при Министерстве иностранных дел Российской Федерации»", "ГлавУпДК при МИД России"],
    "ФГУП «Госкорпорация по ОрВД»": ["Федеральное государственное унитарное предприятие «Государственная корпорация по организации воздушного движения в Российской Федерации»", "Госкорпорация по ОрВД"],
    "АО «Банк Интеза»": ["Акционерное общество «Банк Интеза»"],
    "АО «НСПК»": ["Акционерное общество «Национальная система платежных карт»"],
    "АО «Центральная пригородная пассажирская компания»": ["ЦППК"],
    "АО «Всероссийский банк развития регионов»": ["ВБРР"],
    "ООО «Газпром Нефтехим Салават»": ["Салаватнефтеоргсинтез", "Общество с ограниченной ответственностью «Газпром нефтехим Салават»"],
    "ФБУ РФЦСЭ при Минюсте России": ["Федеральное бюджетное учреждение Российский Федеральный центр судебной экспертизы имени профессора А.Р. Шляхова при Министерстве юстиции Российской Федерации"],
    "ПАО «Яковлев», Иркутский авиационный завод": ["ОАК яковлев"],
    "ООО «Форвард Энерго»": ["Публичное акционерное общество «Форвард Энерго»", "ФЭ"],
    "ГК «ТАГРАС»": ["Холдинг «ТАГРАС»"],
    "ОГКУ «Центр информационно-технического обслуживания»": ["ЦИТО", "ОГКУ «ЦИТО»", "Областное государственное казённое учреждение «Центр информационно-технического обслуживания»", "ЦИТО Челябинской области"],
    "ООО «РусГидро ИТ сервис»": ["Общество с ограниченной ответственностью «РусГидро ИТ сервис»", "ООО «Гидросервис»"]
  };

  function normalizeForSearch(value) {
    return String(value || "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  }

  var clientAliasIndex = null;

  function clientNameMatches(name, query) {
    var q = normalizeForSearch(query);
    if (!q) return true;
    if (normalizeForSearch(name).indexOf(q) !== -1) return true;
    if (!clientAliasIndex) {
      clientAliasIndex = {};
      Object.keys(CLIENT_SEARCH_ALIASES).forEach(function (key) {
        clientAliasIndex[normalizeForSearch(key)] = CLIENT_SEARCH_ALIASES[key];
      });
    }
    var aliases = clientAliasIndex[normalizeForSearch(name)] || [];
    for (var i = 0; i < aliases.length; i++) {
      if (normalizeForSearch(aliases[i]).indexOf(q) !== -1) return true;
    }
    return false;
  }

  function applyLogoSearch() {
    var query = searchEl ? searchEl.value.trim() : "";
    var visible = 0;
    listEl.querySelectorAll("li").forEach(function (item) {
      var btn = item.querySelector("[data-geo-id]");
      var client = findById(btn.getAttribute("data-geo-id"));
      var show = !query || (client && clientNameMatches(client.client, query));
      item.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyEl) emptyEl.hidden = visible !== 0;
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
    activeQueue = [];
    activeIndex = 0;
    anchorCity = null;
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
    var avoid = pins.filter(function (pin) {
      return pin.classList.contains("is-active");
    });
    if (!avoid.length) avoid = [anchorPin];

    var mapBox = mapEl.getBoundingClientRect();
    var cardW = Math.min(360, mapBox.width - 32);
    var wasOpen = cardEl.classList.contains("is-open") && !cardEl.hidden;
    var margin = 16;

    cardEl.style.width = cardW + "px";
    cardEl.hidden = false;
    var cardH = cardEl.offsetHeight;

    var obstacles = avoid.map(function (pin) {
      var box = pin.getBoundingClientRect();
      return {
        left: box.left - mapBox.left - 12,
        top: box.top - mapBox.top - 12,
        right: box.right - mapBox.left + 12,
        bottom: box.bottom - mapBox.top + 12,
        cx: box.left + box.width / 2 - mapBox.left,
        cy: box.top + box.height / 2 - mapBox.top
      };
    });

    function hits(left, top) {
      var right = left + cardW;
      var bottom = top + cardH;
      var count = 0;
      obstacles.forEach(function (obstacle) {
        if (left < obstacle.right && right > obstacle.left && top < obstacle.bottom && bottom > obstacle.top) {
          count += 1;
        }
      });
      return count;
    }

    var centroidX = 0;
    var centroidY = 0;
    obstacles.forEach(function (obstacle) {
      centroidX += obstacle.cx;
      centroidY += obstacle.cy;
    });
    centroidX /= obstacles.length;
    centroidY /= obstacles.length;

    var best = null;
    function consider(rawLeft, rawTop, bias) {
      var left = Math.max(margin, Math.min(rawLeft, mapBox.width - cardW - margin));
      var top = Math.max(margin, Math.min(rawTop, mapBox.height - cardH - margin));
      var dx = left + cardW / 2 - centroidX;
      var dy = top + cardH / 2 - centroidY;
      var score = hits(left, top) * 1000000 + Math.hypot(dx, dy) + (bias || 0);
      if (!best || score < best.score) best = { left: left, top: top, score: score };
    }

    if (avoid.length === 1) {
      var pinBox = anchorPin.getBoundingClientRect();
      var besideLeft = pinBox.right - mapBox.left + 16;
      var besideTop = pinBox.top - mapBox.top - cardH / 2 + pinBox.height / 2;
      if (besideLeft + cardW > mapBox.width - margin) {
        besideLeft = pinBox.left - mapBox.left - cardW - 16;
      }
      consider(besideLeft, besideTop, -48);
    }

    var step = 32;
    var maxLeft = mapBox.width - cardW - margin;
    var maxTop = mapBox.height - cardH - margin;
    for (var left = margin; left <= maxLeft; left += step) {
      for (var top = margin; top <= maxTop; top += step) {
        consider(left, top, 0);
      }
    }
    consider(maxLeft, margin, 0);
    consider(maxLeft, maxTop, 0);

    cardEl.style.left = best.left + "px";
    cardEl.style.top = best.top + "px";
    setCardOriginFromPin(anchorPin, best.left, best.top);
    showCard(!wasOpen);
  }

  function setLogo(img, src, fallback) {
    img.onerror = function () {
      img.onerror = null;
      if (fallback && img.src.indexOf(fallback) === -1) img.src = fallback;
    };
    img.src = src;
  }

  function yearKey(project) {
    var match = String(project.year || "").match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function queueFromClient(item) {
    return item.projects.map(function (project, index) {
      return { item: item, index: index };
    });
  }

  function projectsInCity(city) {
    var queue = [];
    DATA.forEach(function (item) {
      item.projects.forEach(function (project, index) {
        var cities = project.cities && project.cities.length ? project.cities : item.cities;
        if (cities.indexOf(city) !== -1) queue.push({ item: item, index: index });
      });
    });
    queue.sort(function (a, b) {
      return yearKey(b.item.projects[b.index]) - yearKey(a.item.projects[a.index]);
    });
    return queue;
  }

  function pinByCity(city) {
    var found = pins.filter(function (pin) {
      return pin.getAttribute("data-city") === city;
    });
    return found[0] || null;
  }

  function revealLogo(item) {
    listEl.querySelectorAll(".home-geo__logo-card").forEach(function (btn) {
      var on = btn.getAttribute("data-geo-id") === item.id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var btn = listEl.querySelector('[data-geo-id="' + item.id + '"]');
    var scroller = root.querySelector(".home-geo__logos-scroll");
    if (!btn || !scroller) return;
    var btnBox = btn.getBoundingClientRect();
    var railBox = scroller.getBoundingClientRect();
    var alreadyVisible = btnBox.top >= railBox.top - 1 && btnBox.bottom <= railBox.bottom + 1;
    if (alreadyVisible) return;
    var nextTop = Math.max(0, scroller.scrollTop + (btnBox.top - railBox.top) - (railBox.height - btnBox.height) / 2);
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      scroller.scrollTop = nextTop;
      return;
    }
    var startTop = scroller.scrollTop;
    var distance = nextTop - startTop;
    var duration = Math.min(560, Math.max(280, Math.abs(distance) * 0.45));
    var started = 0;
    var token = ++logoScrollToken;
    var pageY = window.scrollY;
    var pageX = window.scrollX;
    function stepScroll(now) {
      if (token !== logoScrollToken) return;
      if (!started) started = now;
      var progress = Math.min(1, (now - started) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      scroller.scrollTop = startTop + distance * eased;
      if (window.scrollY !== pageY || window.scrollX !== pageX) window.scrollTo(pageX, pageY);
      if (progress < 1) window.requestAnimationFrame(stepScroll);
    }
    window.requestAnimationFrame(stepScroll);
  }

  function renderSlide(animate) {
    var slot = activeQueue[activeIndex];
    if (!slot) return;
    activeItem = slot.item;
    var project = activeItem.projects[slot.index];
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
    setLogo(logoDarkEl, activeItem.logoDark || activeItem.logo, activeItem.logo);

    var total = activeQueue.length;
    var multi = total > 1;
    navEl.hidden = !multi;
    cardEl.classList.toggle("is-multi", multi);
    if (countEl) {
      countEl.textContent = multi ? activeIndex + 1 + " из " + total : "";
    }
    if (navEl) {
      navEl.setAttribute(
        "aria-label",
        anchorCity ? "Проекты в городе " + anchorCity : "Проекты заказчика"
      );
    }

    revealLogo(activeItem);
    highlightCities(cities);
    placeCard(pinByCity(anchorCity) || pinsForCities(cities)[0] || null);
  }

  function openQueue(queue, city) {
    if (!queue.length) return;
    activeQueue = queue;
    activeIndex = 0;
    anchorCity = city || null;
    root.classList.add("is-card-open");
    renderSlide(false);
    focusWithoutPageScroll(closeBtn);
  }

  function focusWithoutPageScroll(el) {
    if (!el) return;
    var pageY = window.scrollY;
    var pageX = window.scrollX;
    el.focus({ preventScroll: true });
    if (window.scrollY !== pageY || window.scrollX !== pageX) {
      window.scrollTo(pageX, pageY);
    }
  }

  function openItem(item, startIndex) {
    var queue = queueFromClient(item);
    if (!queue.length) return;
    var start = typeof startIndex === "number" ? startIndex : 0;
    if (start < 0 || start >= queue.length) start = 0;
    var project = item.projects[start];
    var cities = project && project.cities && project.cities.length ? project.cities : item.cities;
    if (!pinsForCities(item.cities).length && !pinsForCities(cities).length) return;
    activeQueue = queue.slice(start).concat(queue.slice(0, start));
    activeIndex = 0;
    anchorCity = null;
    root.classList.add("is-card-open");
    renderSlide(false);
    focusWithoutPageScroll(closeBtn);
  }

  function step(delta) {
    if (activeQueue.length < 2) return;
    var total = activeQueue.length;
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
      openItem(item, 0);
    });

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () {
        if ((pin.getAttribute("data-count") || "0") === "0") return;
        var city = pin.getAttribute("data-city");
        openQueue(projectsInCity(city), city);
      });
    });

    if (searchEl) {
      searchEl.addEventListener("input", applyLogoSearch);
    }
    if (sortEl) {
      sortEl.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-sort]");
        if (!btn || btn.getAttribute("aria-pressed") === "true") return;
        sortEl.querySelectorAll("[data-sort]").forEach(function (item) {
          var on = item === btn;
          item.setAttribute("aria-pressed", on ? "true" : "false");
        });
        buildLogos();
      });
    }

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
      var active = pinByCity(anchorCity) || root.querySelector(".home-geo__pin.is-active");
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
