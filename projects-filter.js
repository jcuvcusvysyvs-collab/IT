/**
 * Фильтр и поиск заказчика — projects.html?client=<id>[,id2] | ?q=<query>
 * Мультивыбор заказчиков (галочки) + «Применить».
 * Desktop: поиск + дропдаун. Mobile: поиск + кнопка → модалка.
 * Режимы взаимно исключающие (поиск ИЛИ заказчики).
 */
(function () {
  var PARAM_CLIENT = "client";
  var PARAM_QUERY = "q";
  var PARAM_FROM = "from";
  var PARAM_TO = "to";
  var PERIOD_MIN = 2014;
  var PERIOD_MAX = 2027;
  var ALL_LABEL = "Все заказчики";
  var QUERY_MAX = 80;
  var SEARCH_DEBOUNCE_MS = 200;
  var MOBILE_MQ = "(max-width: 720px)";

  var filterEl = document.getElementById("projects-filter");
  var comboEl = document.getElementById("projects-filter-combo");
  var triggerEl = document.getElementById("projects-filter-trigger");
  var triggerTextEl = document.getElementById("projects-filter-trigger-text");
  var mobileBtn = document.getElementById("projects-filter-mobile-btn");
  var menuEl = document.getElementById("projects-filter-menu");
  var optionsEl = document.getElementById("projects-filter-options");
  var modalOptionsEl = document.getElementById("projects-filter-modal-options");
  var clearBtn = document.getElementById("projects-filter-clear");
  var menuClearBtn = document.getElementById("projects-filter-menu-clear");
  var applyBtn = document.getElementById("projects-filter-apply");
  var menuApplyBtn = document.getElementById("projects-filter-menu-apply");
  var resetBtn = document.getElementById("projects-filter-reset");
  var periodFromInput = document.getElementById("projects-period-from");
  var periodToInput = document.getElementById("projects-period-to");
  var periodFromLabel = document.getElementById("projects-period-from-label");
  var periodToLabel = document.getElementById("projects-period-to-label");
  var periodFill = document.getElementById("projects-period-fill");
  var periodBanner = document.getElementById("projects-period-banner");
  var periodBannerFrom = document.getElementById("projects-period-banner-from");
  var periodBannerTo = document.getElementById("projects-period-banner-to");
  var periodBannerCount = document.getElementById("projects-period-banner-count");
  var listEl = document.getElementById("projects-list");
  var searchWrap = document.getElementById("projects-filter-search");
  var searchInput = document.getElementById("projects-search");
  var searchToggle = document.getElementById("projects-filter-search-toggle");
  var searchClearBtn = document.getElementById("projects-search-clear");
  var emptyEl = document.getElementById("projects-filter-empty");
  var emptyTextEl = document.getElementById("projects-filter-empty-text");
  var emptyResetBtn = document.getElementById("projects-filter-empty-reset");
  var modalEl = document.getElementById("projects-filter-modal");
  var modalBackdrop = document.getElementById("projects-filter-modal-backdrop");
  var modalCloseBtn = document.getElementById("projects-filter-modal-close");

  if (!filterEl || !comboEl || !triggerEl || !menuEl || !optionsEl || !listEl) return;

  var activeClients = [];
  var draftClients = [];
  var activeQuery = "";
  var periodFrom = PERIOD_MIN;
  var periodTo = PERIOD_MAX;
  var optionQuery = "";
  var clients = [];
  var clientNames = {};
  var menuOpen = false;
  var modalOpen = false;
  var focusIndex = -1;
  var searchTimer = null;
  var mobileMq = window.matchMedia(MOBILE_MQ);
  var lastFocusEl = null;
  var lockedScrollY = 0;
  var scrollbarCompensation = 0;
  var resetHideTimer = null;
  var modalCloseTimer = null;
  var modalOpenTimer = null;
  var MODAL_ANIM_MS = 520;
  var SUBNAV_LIFT_MS = 580;
  var pinnedSubnav = null;
  var subnavSpacer = null;

  function isMobile() {
    return mobileMq.matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getModalAnimMs() {
    return prefersReducedMotion() ? 0 : MODAL_ANIM_MS;
  }

  function getSubnavLiftMs() {
    return prefersReducedMotion() ? 0 : SUBNAV_LIFT_MS;
  }

  function clearModalTimers() {
    if (modalCloseTimer) {
      window.clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }
    if (modalOpenTimer) {
      window.clearTimeout(modalOpenTimer);
      modalOpenTimer = null;
    }
  }

  function hasActiveClients() {
    return activeClients.length > 0;
  }

  function setResetVisible(show) {
    if (!resetBtn) return;

    if (resetHideTimer) {
      window.clearTimeout(resetHideTimer);
      resetHideTimer = null;
    }

    if (show) {
      resetBtn.hidden = false;
      resetBtn.setAttribute("aria-hidden", "false");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (hasActiveClients() || sideFiltersSet()) resetBtn.classList.add("is-visible");
        });
      });
      return;
    }

    resetBtn.classList.remove("is-visible");
    resetBtn.setAttribute("aria-hidden", "true");
    resetHideTimer = window.setTimeout(function () {
      resetHideTimer = null;
      if (!hasActiveClients() && !sideFiltersSet()) resetBtn.hidden = true;
    }, 320);
  }

  function focusEl(el) {
    if (!el || typeof el.focus !== "function") return;
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      el.focus();
    }
  }

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function getSubnavEl() {
    return document.querySelector("[data-section-subnav]");
  }

  /* Sticky + transform = рывок (sticky срывается). Сначала фиксируем ленту, потом анимируем. */
  function pinSubnavForFilter() {
    var subnav = getSubnavEl();
    if (!subnav || !subnav.classList.contains("is-stuck")) return false;
    if (pinnedSubnav) return true;

    var rect = subnav.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.height < 8) return false;

    var styles = window.getComputedStyle(subnav);
    var height = Math.round(rect.height) || 56;

    subnavSpacer = document.createElement("div");
    subnavSpacer.className = "page-section-subnav__spacer page-section-subnav__spacer--filter";
    subnavSpacer.setAttribute("aria-hidden", "true");
    subnavSpacer.style.height = height + "px";
    subnavSpacer.style.marginTop = styles.marginTop;
    subnavSpacer.style.marginBottom = styles.marginBottom;
    subnavSpacer.style.pointerEvents = "none";

    if (subnav.parentNode) {
      subnav.parentNode.insertBefore(subnavSpacer, subnav);
    }

    subnav.classList.add("is-stuck", "page-section-subnav--filter-pinned");
    subnav.style.top = Math.round(rect.top) + "px";
    pinnedSubnav = subnav;
    void subnav.offsetHeight;
    return true;
  }

  function setChromeAway(away) {
    document.documentElement.classList.toggle("projects-filter-chrome-away", !!away);
    document.body.classList.toggle("projects-filter-chrome-away", !!away);
  }

  function setSubnavAway(away) {
    setChromeAway(away);
    if (!pinnedSubnav) return;
    if (away) {
      pinnedSubnav.classList.add("page-section-subnav--filter-away");
    } else {
      pinnedSubnav.classList.remove("page-section-subnav--filter-away");
    }
  }

  function unpinSubnavAfterFilter() {
    if (!pinnedSubnav) {
      if (subnavSpacer && subnavSpacer.parentNode) {
        subnavSpacer.parentNode.removeChild(subnavSpacer);
      }
      subnavSpacer = null;
      return;
    }

    var subnav = pinnedSubnav;
    subnav.classList.remove("page-section-subnav--filter-away", "page-section-subnav--filter-pinned");
    subnav.style.top = "";
    subnav.style.transform = "";

    if (subnavSpacer && subnavSpacer.parentNode) {
      subnavSpacer.parentNode.removeChild(subnavSpacer);
    }
    subnavSpacer = null;
    pinnedSubnav = null;
  }

  function lockBodyScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    scrollbarCompensation = getScrollbarWidth();
    document.documentElement.classList.add("projects-filter-modal-open");
    document.body.classList.add("projects-filter-modal-open");
    if (scrollbarCompensation > 0) {
      document.body.style.paddingRight = scrollbarCompensation + "px";
    }
  }

  function unlockBodyScroll() {
    var restoreY = lockedScrollY;
    var htmlEl = document.documentElement;
    var prevScrollBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";
    document.documentElement.classList.remove("projects-filter-modal-open");
    document.body.classList.remove("projects-filter-modal-open");
    document.body.style.paddingRight = "";
    window.scrollTo(0, restoreY);
    htmlEl.style.scrollBehavior = prevScrollBehavior;
  }

  function stripHtml(html) {
    return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function plainText(el) {
    return stripHtml(el ? el.textContent || "" : "");
  }

  function sanitizeQuery(raw) {
    var s = String(raw == null ? "" : raw);
    s = s.replace(/[\u0000-\u001F\u007F]/g, "");
    s = s.replace(/\s+/g, " ").trim();
    if (s.length > QUERY_MAX) s = s.slice(0, QUERY_MAX);
    return s;
  }

  function normalizeForSearch(name) {
    return stripHtml(name)
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeClientKey(name) {
    return stripHtml(name).toLowerCase();
  }

  function getItemClientName(item) {
    if (item.dataset.projectClient) {
      return stripHtml(item.dataset.projectClient);
    }

    var clientEl = item.querySelector(".page-projects__item-client");
    if (clientEl) {
      return plainText(clientEl);
    }

    return "";
  }

  function getItemClientKey(item) {
    var name = getItemClientName(item);
    return name ? normalizeClientKey(name) : "";
  }

  function cloneIds(ids) {
    return (ids || []).slice();
  }

  function clientsToParam(ids) {
    return (ids || []).filter(Boolean).join(",");
  }

  function hasClientInList(clientId) {
    if (!clientId) return false;
    return clients.some(function (client) {
      return client.id === clientId;
    });
  }

  function resolveOneClientParam(clientId) {
    if (!clientId) return "";
    if (hasClientInList(clientId)) return clientId;

    var c = window.DCE_CLIENTS && window.DCE_CLIENTS[clientId];
    if (c && c.name) {
      var byName = normalizeClientKey(c.name);
      if (hasClientInList(byName)) return byName;
    }

    return "";
  }

  function resolveClientParams(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map(function (id) {
          return resolveOneClientParam(String(id || "").trim());
        })
        .filter(Boolean)
        .filter(function (id, index, arr) {
          return arr.indexOf(id) === index;
        });
    }

    return String(raw)
      .split(",")
      .map(function (part) {
        return resolveOneClientParam(part.trim());
      })
      .filter(Boolean)
      .filter(function (id, index, arr) {
        return arr.indexOf(id) === index;
      });
  }

  function assignClientKeys() {
    listEl.querySelectorAll(".page-projects__item").forEach(function (item) {
      var key = getItemClientKey(item);
      if (key) {
        item.dataset.projectClientKey = key;
      }
    });
  }

  function pluralProjects(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return "проектов";
    if (mod10 === 1) return "проект";
    if (mod10 >= 2 && mod10 <= 4) return "проекта";
    return "проектов";
  }

  function pluralClients(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return "заказчиков";
    if (mod10 === 1) return "заказчик";
    if (mod10 >= 2 && mod10 <= 4) return "заказчика";
    return "заказчиков";
  }

  function formatProjectCount(n) {
    return n + " " + pluralProjects(n);
  }

  function isFilterActive() {
    return !!(hasActiveClients() || activeQuery);
  }

  function isDraftSelected(id) {
    return draftClients.indexOf(id) !== -1;
  }

  function syncOptionButton(btn) {
    if (!btn) return;
    var selected = isDraftSelected(btn.dataset.clientId || "");
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-selected", selected ? "true" : "false");
  }

  function syncOptionButtons() {
    optionsEl.querySelectorAll(".projects-filter__option").forEach(syncOptionButton);
    if (modalOptionsEl) {
      modalOptionsEl
        .querySelectorAll(".projects-filter-modal__option")
        .forEach(syncOptionButton);
    }
  }

  function toggleDraftClient(id) {
    if (!id) return;
    var idx = draftClients.indexOf(id);
    if (idx === -1) draftClients.push(id);
    else draftClients.splice(idx, 1);
    syncDraftClearButtons();
    /* Не пересобираем список на клике — иначе кнопка уходит из DOM
       и document-click считает это кликом «снаружи» и закрывает меню. */
    syncOptionButtons();
  }

  function syncDraftClearButtons() {
    var hasDraft = draftClients.length > 0;
    [clearBtn, menuClearBtn, applyBtn, menuApplyBtn].forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !hasDraft;
      btn.setAttribute("aria-disabled", hasDraft ? "false" : "true");
    });
  }

  function syncDraftUI() {
    syncDraftClearButtons();
    renderOptions();
  }

  function beginDraftFromActive() {
    draftClients = cloneIds(activeClients);
    syncDraftClearButtons();
  }

  function updateYearCounts() {
    listEl.querySelectorAll(".page-projects__year-group").forEach(function (group) {
      var countEl = group.querySelector(".page-projects__year-count");
      if (!countEl) return;

      var selector = isFilterActive()
        ? ".page-projects__item:not(.is-filtered-out)"
        : ".page-projects__item";
      var count = group.querySelectorAll(selector).length;
      var valueEl = countEl.querySelector(".page-projects__year-count-value");
      var labelEl = countEl.querySelector(".page-projects__year-count-label");

      if (valueEl && labelEl) {
        valueEl.textContent = count;
        labelEl.textContent = pluralProjects(count);
        return;
      }

      countEl.textContent = formatProjectCount(count);
    });
  }

  function getClientFullName(id) {
    if (!id) return ALL_LABEL;
    if (clientNames[id]) return clientNames[id];

    var c = window.DCE_CLIENTS && window.DCE_CLIENTS[id];
    if (c && c.name) return stripHtml(c.name);

    return id;
  }

  function getClientsLabel(ids) {
    if (!ids || !ids.length) return ALL_LABEL;
    if (ids.length === 1) return getClientFullName(ids[0]);
    return ids.length + " " + pluralClients(ids.length);
  }

  function loadClients() {
    var map = {};

    listEl.querySelectorAll(".page-projects__item").forEach(function (item) {
      var key = getItemClientKey(item);
      var name = getItemClientName(item);
      if (!key || !name) return;

      if (!map[key]) {
        map[key] = { id: key, name: name, count: 0 };
      }

      if (name.length > map[key].name.length) {
        map[key].name = name;
      }

      map[key].count += 1;
      item.dataset.projectClientKey = key;
    });

    clientNames = {};
    Object.keys(map).forEach(function (key) {
      clientNames[key] = map[key].name;
    });

    return Object.keys(map)
      .map(function (key) {
        return map[key];
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "ru");
      });
  }

  function itemMatchesClients(item, clientIds) {
    if (!clientIds || !clientIds.length) return true;
    var key = item.getAttribute("data-project-client-key") || getItemClientKey(item);
    return clientIds.indexOf(key) !== -1;
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

  var clientAliasIndex = null;

  function getClientAliases(name) {
    if (!clientAliasIndex) {
      clientAliasIndex = {};
      Object.keys(CLIENT_SEARCH_ALIASES).forEach(function (key) {
        clientAliasIndex[normalizeForSearch(key)] = CLIENT_SEARCH_ALIASES[key];
      });
    }
    return clientAliasIndex[normalizeForSearch(name)] || [];
  }

  function clientNameMatches(name, query) {
    if (!query) return true;
    var q = normalizeForSearch(query);
    if (!q) return true;
    if (normalizeForSearch(name).indexOf(q) !== -1) return true;
    var aliases = getClientAliases(name);
    for (var i = 0; i < aliases.length; i++) {
      if (normalizeForSearch(aliases[i]).indexOf(q) !== -1) return true;
    }
    return false;
  }

  function itemMatchesQuery(item, query) {
    if (!query) return true;
    var name = getItemClientName(item);
    if (!name) return false;
    return clientNameMatches(name, query);
  }

  function itemMatches(item) {
    if (!itemMatchesPeriod(item)) return false;
    if (!itemMatchesVendor(item)) return false;
    if (activeQuery) return itemMatchesQuery(item, activeQuery);
    if (hasActiveClients()) return itemMatchesClients(item, activeClients);
    return true;
  }

  var VENDOR_RULES = {
    huawei: /Huawei|OceanStor|FusionServer/i,
    hpe: /\bHPE\b/i,
    cisco: /Cisco/i,
    "dell-emc": /Dell|EMC/i,
    astra: /AstraLinux|Astra Linux/i,
    fujitsu: /Fujitsu/i,
    brocade: /Brocade/i,
    netapp: /NetApp/i,
    zvirt: /zVirt/i,
    nec: /\bNEC\b/,
    redos: /RED\s+OS|РЕД\s+ОС/i,
    bulat: /BULAT|БУЛАТ/i,
    vmware: /VMware|vSphere|vCenter/i,
    microsoft: /Microsoft|Windows Server|Hyper-V|Active Directory|MS Exchange|MS SQL|SQL Server/i,
    vmmanager: /VMmanager/i,
    termidesk: /Termidesk|Термидеск/i,
    spacevm: /SpaceVM/i,
    citrix: /Citrix/i,
    mellanox: /Mellanox/i,
    veeam: /Veeam/i,
    cyberbackup: /Кибер\s+Бэкап|Кибербэкап|Cyber\s+Backup/i,
    commvault: /CommVault/i,
    rupost: /RuPost/i,
    communigate: /CommuniGate/i
  };
  var activeVendors = [];

  function vendorIsSet() {
    return activeVendors.length > 0;
  }

  function sideFiltersSet() {
    return periodIsSet() || vendorIsSet();
  }

  function itemMatchesVendor(item) {
    if (!vendorIsSet()) return true;
    var marked = (item.getAttribute("data-vendors") || "").split(/\s+/);
    var descEl = item.querySelector(".page-projects__item-desc");
    var text = descEl ? descEl.textContent || "" : "";
    for (var i = 0; i < activeVendors.length; i++) {
      var id = activeVendors[i];
      if (marked.indexOf(id) !== -1) return true;
      var rule = VENDOR_RULES[id];
      if (rule && rule.test(text)) return true;
    }
    return false;
  }

  function syncVendorButtons() {
    var box = document.getElementById("projects-vendors");
    if (!box) return;
    box.querySelectorAll(".projects-vendors__option").forEach(function (btn) {
      var on = activeVendors.indexOf(btn.getAttribute("data-vendor")) !== -1;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function periodIsSet() {
    return periodFrom > PERIOD_MIN || periodTo < PERIOD_MAX;
  }

  function itemYearRange(item) {
    var meta = item.querySelector(".page-projects__item-meta, .page-projects__item-tag");
    var text = meta ? meta.textContent || "" : "";
    var found = text.match(/20\d{2}/g);
    if (!found || !found.length) return null;
    var start = parseInt(found[0], 10);
    var end = parseInt(found[found.length - 1], 10);
    return { start: start, end: end };
  }

  function itemMatchesPeriod(item) {
    if (!periodIsSet()) return true;
    var range = itemYearRange(item);
    if (!range) return false;
    return range.end >= periodFrom && range.start <= periodTo;
  }

  function projectsWord(n) {
    var n100 = Math.abs(n) % 100;
    var n10 = n100 % 10;
    if (n100 >= 11 && n100 <= 14) return "проектов";
    if (n10 === 1) return "проект";
    if (n10 >= 2 && n10 <= 4) return "проекта";
    return "проектов";
  }

  function paintPeriod(visibleCount) {
    if (periodFromLabel) periodFromLabel.textContent = String(periodFrom);
    if (periodToLabel) periodToLabel.textContent = String(periodTo);
    if (periodFromInput) periodFromInput.value = String(periodFrom);
    if (periodToInput) periodToInput.value = String(periodTo);
    if (periodFill) {
      var span = PERIOD_MAX - PERIOD_MIN;
      var fromRatio = (periodFrom - PERIOD_MIN) / span;
      var toRatio = (PERIOD_MAX - periodTo) / span;
      periodFill.style.left = "calc(11px + (100% - 22px) * " + fromRatio + ")";
      periodFill.style.right = "calc(11px + (100% - 22px) * " + toRatio + ")";
    }
    var active = periodIsSet();
    if (periodBanner) periodBanner.hidden = !active;
    if (!active) return;
    if (periodBannerFrom) periodBannerFrom.textContent = String(periodFrom);
    if (periodBannerTo) periodBannerTo.textContent = String(periodTo);
    if (periodBannerCount && typeof visibleCount === "number") {
      periodBannerCount.textContent = visibleCount + " " + projectsWord(visibleCount);
    }
  }

  function readPeriodFromUrl(url) {
    var from = parseInt(url.searchParams.get(PARAM_FROM) || "", 10);
    var to = parseInt(url.searchParams.get(PARAM_TO) || "", 10);
    if (!from || from < PERIOD_MIN) from = PERIOD_MIN;
    if (!to || to > PERIOD_MAX) to = PERIOD_MAX;
    if (from > to) from = to;
    periodFrom = from;
    periodTo = to;
  }

  function onPeriodInput(event) {
    var from = parseInt(periodFromInput.value, 10);
    var to = parseInt(periodToInput.value, 10);
    if (from > to) {
      if (event && event.target === periodFromInput) to = from;
      else from = to;
    }
    periodFrom = from;
    periodTo = to;
    if (event && event.target) event.target.style.zIndex = "4";
    applyFilters({}, { scroll: false });
  }

  function syncSearchInput() {
    if (!searchInput) return;
    if (searchInput.value !== activeQuery) {
      searchInput.value = activeQuery;
    }
    if (searchClearBtn) {
      searchClearBtn.hidden = !activeQuery;
    }
    if (searchWrap) {
      searchWrap.classList.toggle("is-active", !!activeQuery);
    }
  }

  function updateEmptyState(visibleCount) {
    if (!emptyEl) return;
    var show = (isFilterActive() || sideFiltersSet()) && visibleCount === 0;
    emptyEl.hidden = !show;
    if (emptyTextEl) {
      emptyTextEl.textContent = show
        ? activeQuery
          ? "Ничего не найдено по запросу"
          : "Ничего не найдено"
        : "";
    }
    if (emptyResetBtn) {
      emptyResetBtn.textContent = activeQuery ? "Сбросить поиск" : "Сбросить фильтр";
    }
  }

  function applyFilters(state, options) {
    var opts = options || {};
    var nextClients =
      state && "clients" in state
        ? resolveClientParams(state.clients)
        : cloneIds(activeClients);
    var nextQuery = state && "query" in state ? sanitizeQuery(state.query) : activeQuery;

    if (opts.mode === "query" || (state && "query" in state && !("clients" in state))) {
      activeQuery = nextQuery;
      activeClients = [];
    } else if (opts.mode === "client" || (state && "clients" in state && !("query" in state))) {
      activeClients = nextClients;
      activeQuery = "";
    } else if (state && "query" in state && "clients" in state) {
      if (nextQuery) {
        activeQuery = nextQuery;
        activeClients = [];
      } else {
        activeClients = nextClients;
        activeQuery = "";
      }
    }

    draftClients = cloneIds(activeClients);

    var visibleCount = 0;

    listEl.querySelectorAll(".page-projects__item").forEach(function (item) {
      var match = itemMatches(item);
      item.classList.toggle("is-filtered-out", !match);
      if (match) visibleCount += 1;
    });

    listEl.querySelectorAll(".page-projects__year-group").forEach(function (group) {
      var visible = group.querySelectorAll(".page-projects__item:not(.is-filtered-out)").length;
      group.classList.toggle("is-filtered-empty", visible === 0);
    });

    updateYearCounts();
    updateUI();
    updateEmptyState(visibleCount);
    paintPeriod(visibleCount);
    syncVendorButtons();
    syncSearchInput();

    if (typeof window.refreshInfraReveal === "function") {
      window.refreshInfraReveal();
    }

    if (opts.updateUrl !== false) {
      var url = new URL(window.location.href);
      var clientParam = clientsToParam(activeClients);
      if (clientParam) {
        url.searchParams.set(PARAM_CLIENT, clientParam);
        url.searchParams.delete(PARAM_QUERY);
      } else if (activeQuery) {
        url.searchParams.set(PARAM_QUERY, activeQuery);
        url.searchParams.delete(PARAM_CLIENT);
      } else {
        url.searchParams.delete(PARAM_CLIENT);
        url.searchParams.delete(PARAM_QUERY);
      }
      if (periodIsSet()) {
        url.searchParams.set(PARAM_FROM, String(periodFrom));
        url.searchParams.set(PARAM_TO, String(periodTo));
      } else {
        url.searchParams.delete(PARAM_FROM);
        url.searchParams.delete(PARAM_TO);
      }
      url.hash = "projects-all";
      history.replaceState(
        { client: clientParam, clients: cloneIds(activeClients), q: activeQuery },
        "",
        url.toString()
      );
    }

    if (opts.scroll && (hasActiveClients() || activeQuery)) {
      scrollToFirstResult(opts.scroll);
    }
  }

  function layoutViewportTop(el) {
    var y = 0;
    var node = el;
    while (node) {
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return y - (window.scrollY || window.pageYOffset || 0);
  }

  function scrollToFirstResult(behavior) {
    var first = listEl.querySelector(".page-projects__item:not(.is-filtered-out)");
    if (!first) return;

    var gap = 28;
    function chromeLine() {
      var edge = 0;
      var head = document.querySelector(".site-header");
      var bar = document.querySelector(".page-section-subnav");
      if (head && !head.classList.contains("site-header--hidden")) {
        var headBottom = head.getBoundingClientRect().bottom;
        if (headBottom > edge) edge = headBottom;
      }
      if (bar) {
        var barBottom = bar.getBoundingClientRect().bottom;
        if (barBottom > edge) edge = barBottom;
      }
      return edge + gap;
    }

    var chrome = chromeLine();

    var top = layoutViewportTop(first);
    if (top >= chrome - 8) return;

    var target = Math.max(0, Math.round(top + window.scrollY - chrome));
    var start = window.scrollY || window.pageYOffset || 0;
    var change = target - start;
    if (Math.abs(change) < 2) return;

    var htmlEl = document.documentElement;
    var scroller = document.scrollingElement || htmlEl;
    var prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";

    function jump(y) {
      scroller.scrollTop = y;
    }

    function restoreBehavior() {
      htmlEl.style.scrollBehavior = prevBehavior;
    }

    if (behavior === "auto" || prefersReducedMotion()) {
      jump(target);
      restoreBehavior();
      return;
    }

    var duration = Math.min(680, Math.max(320, Math.abs(change) * 0.42));
    var t0 = window.performance.now();
    var stopped = false;

    function stopEarly() {
      stopped = true;
    }

    window.addEventListener("wheel", stopEarly, { passive: true });
    window.addEventListener("touchmove", stopEarly, { passive: true });

    function finish(correct) {
      window.removeEventListener("wheel", stopEarly);
      window.removeEventListener("touchmove", stopEarly);
      if (correct && !stopped) {
        var card = listEl.querySelector(".page-projects__item:not(.is-filtered-out)");
        if (card) {
          var delta = layoutViewportTop(card) - chromeLine();
          if (Math.abs(delta) > 6) jump((window.scrollY || 0) + delta);
        }
      }
      restoreBehavior();
    }

    function frame(now) {
      if (stopped) {
        finish(false);
        return;
      }
      var p = Math.min(1, (now - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      jump(Math.round(start + change * eased));
      if (p < 1) {
        window.requestAnimationFrame(frame);
        return;
      }
      window.requestAnimationFrame(function () {
        finish(true);
      });
    }

    window.requestAnimationFrame(frame);
  }

  function applyFilter(clientIds, options) {
    applyFilters(
      { clients: Array.isArray(clientIds) ? clientIds : clientIds ? [clientIds] : [] },
      Object.assign({ mode: "client" }, options || {})
    );
  }

  function applySearch(query, options) {
    applyFilters({ query: query || "" }, Object.assign({ mode: "query" }, options || {}));
  }

  function scheduleSearchFromInput() {
    if (!searchInput) return;
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      searchTimer = null;
      applySearch(searchInput.value, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
  }

  function flushSearchFromInput() {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
      searchTimer = null;
    }
    if (!searchInput) return;
    applySearch(searchInput.value, { scroll: false });
  }

  function fillOptionsList(targetEl) {
    if (!targetEl) return;
    targetEl.replaceChildren();

    clients.forEach(function (item) {
      if (targetEl !== modalOptionsEl && !clientNameMatches(item.name, optionQuery)) return;
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");

      var selected = isDraftSelected(item.id);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        targetEl === modalOptionsEl
          ? "projects-filter-modal__option"
          : "projects-filter__option";
      btn.setAttribute("role", "option");
      btn.dataset.clientId = item.id;
      btn.setAttribute("aria-selected", selected ? "true" : "false");
      if (selected) btn.classList.add("is-selected");

      var check = document.createElement("span");
      check.className =
        targetEl === modalOptionsEl
          ? "projects-filter-modal__check"
          : "projects-filter__check";
      check.setAttribute("aria-hidden", "true");

      var label = document.createElement("span");
      label.className =
        targetEl === modalOptionsEl
          ? "projects-filter-modal__option-label"
          : "projects-filter__option-label";
      label.textContent = item.name;

      btn.appendChild(check);
      btn.appendChild(label);

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleDraftClient(item.id);
      });

      li.appendChild(btn);
      targetEl.appendChild(li);
    });

    if (targetEl !== modalOptionsEl && optionQuery && !targetEl.children.length) {
      var empty = document.createElement("li");
      empty.className = "projects-filter__options-empty";
      empty.textContent = "Ничего не найдено";
      targetEl.appendChild(empty);
    }
  }

  function renderOptions() {
    focusIndex = -1;
    fillOptionsList(optionsEl);
    if (modalOptionsEl) fillOptionsList(modalOptionsEl);
  }

  var menuCloseTimer = null;
  var MENU_ANIM_MS = 340;

  function getMenuAnimMs() {
    return prefersReducedMotion() ? 0 : MENU_ANIM_MS;
  }

  function clearMenuCloseTimer() {
    if (menuCloseTimer) {
      window.clearTimeout(menuCloseTimer);
      menuCloseTimer = null;
    }
  }

  function fitMenuToBlock() {
    if (!menuEl || isMobile()) return;
    if (!menuOpen || !filterEl) {
      menuEl.style.maxHeight = "";
      return;
    }
    var field = filterEl.querySelector(".projects-filter__search");
    var block = document.getElementById("projects-all");
    if (!field || !block) return;
    var cap = 22 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
    var limit = Math.min(window.innerHeight - 16, block.getBoundingClientRect().bottom - 12);
    var space = limit - field.getBoundingClientRect().bottom;
    menuEl.style.maxHeight = Math.round(Math.min(cap, Math.max(0, space))) + "px";
  }

  function pinFilter() {
    if (!filterEl || isMobile()) return;
    var subnav = document.querySelector(".page-section-subnav");
    var top = "";
    if (subnav && subnav.classList.contains("is-stuck")) {
      top = Math.round(subnav.getBoundingClientRect().bottom + 12) + "px";
    }
    if (filterEl.style.top !== top) filterEl.style.top = top;
    if (filterEl.style.height) filterEl.style.height = "";
    if (filterEl.style.maxHeight) filterEl.style.maxHeight = "";
  }

  window.addEventListener("scroll", function () {
    pinFilter();
    if (menuOpen) fitMenuToBlock();
  }, { passive: true });

  window.addEventListener("resize", function () {
    pinFilter();
    if (menuOpen) fitMenuToBlock();
  });

  pinFilter();

  function setMenuOpen(open) {
    if (isMobile()) {
      if (open) setModalOpen(true);
      else setModalOpen(false);
      return;
    }

    var nextOpen = !!open;
    if (nextOpen === menuOpen && !menuEl.classList.contains("is-closing")) return;

    clearMenuCloseTimer();
    menuOpen = nextOpen;
    triggerEl.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    if (searchInput) searchInput.setAttribute("aria-expanded", menuOpen ? "true" : "false");

    if (menuOpen) {
      if (modalEl && (modalOpen || !modalEl.hidden)) {
        setModalOpen(false);
      }

      beginDraftFromActive();
      renderOptions();

      menuEl.hidden = false;
      menuEl.classList.remove("is-closing", "is-open");
      menuEl.style.maxHeight = "";
      comboEl.classList.add("is-open");
      fitMenuToBlock();
      if (!menuOpen) return;

      /* Два кадра: сначала стартовое состояние, потом is-open — иначе transition срывается */
      void menuEl.offsetWidth;
      window.requestAnimationFrame(function () {
        if (!menuOpen) return;
        window.requestAnimationFrame(function () {
          if (!menuOpen) return;
          menuEl.classList.add("is-open");
          fitMenuToBlock();
        });
      });
      return;
    }

    comboEl.classList.remove("is-open");
    menuEl.classList.remove("is-open");
    menuEl.classList.add("is-closing");
    menuEl.style.maxHeight = "";
    focusIndex = -1;
    draftClients = cloneIds(activeClients);
    if (optionQuery) {
      optionQuery = "";
      if (searchInput && !activeQuery) searchInput.value = "";
      if (searchClearBtn) searchClearBtn.hidden = !activeQuery;
      if (searchWrap) searchWrap.classList.toggle("is-active", !!activeQuery);
    }

    var animMs = getMenuAnimMs();
    if (!animMs) {
      menuEl.classList.remove("is-closing");
      menuEl.hidden = true;
      return;
    }

    menuCloseTimer = window.setTimeout(function () {
      menuCloseTimer = null;
      if (menuOpen) return;
      menuEl.classList.remove("is-closing");
      menuEl.hidden = true;
    }, animMs);
  }

  function setModalOpen(open) {
    if (!modalEl) return;

    var nextOpen = !!open;
    if (nextOpen === modalOpen) return;

    clearModalTimers();

    modalOpen = nextOpen;

    if (mobileBtn) {
      mobileBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
      mobileBtn.classList.toggle("is-active", modalOpen || hasActiveClients());
    }

    if (modalOpen) {
      clearMenuCloseTimer();
      menuOpen = false;
      comboEl.classList.remove("is-open");
      triggerEl.setAttribute("aria-expanded", "false");
      menuEl.classList.remove("is-open", "is-closing");
      menuEl.hidden = true;

      lastFocusEl = document.activeElement;

      var canLift = pinSubnavForFilter();
      lockBodyScroll();
      beginDraftFromActive();
      renderOptions();

      modalEl.hidden = false;
      modalEl.classList.remove("is-closing");
      modalEl.classList.remove("is-open");
      setSubnavAway(false);

      var liftMs = canLift ? getSubnavLiftMs() : 0;

      function revealFilterSheet() {
        if (!modalOpen) return;
        void modalEl.offsetWidth;
        window.requestAnimationFrame(function () {
          if (!modalOpen) return;
          modalEl.classList.add("is-open");
        });

        var firstFocus =
          modalOptionsEl &&
          (modalOptionsEl.querySelector(".projects-filter-modal__option.is-selected") ||
            modalOptionsEl.querySelector(".projects-filter-modal__option"));
        focusEl(firstFocus);
      }

      window.requestAnimationFrame(function () {
        if (!modalOpen) return;
        window.requestAnimationFrame(function () {
          if (!modalOpen) return;
          setSubnavAway(true);

          if (!liftMs) {
            revealFilterSheet();
            return;
          }

          modalOpenTimer = window.setTimeout(function () {
            modalOpenTimer = null;
            revealFilterSheet();
          }, liftMs);
        });
      });
      return;
    }

    void modalEl.offsetWidth;
    modalEl.classList.remove("is-open");
    modalEl.classList.add("is-closing");
    focusEl(lastFocusEl);
    lastFocusEl = null;
    draftClients = cloneIds(activeClients);

    var animMs = getModalAnimMs();
    var liftBackMs = getSubnavLiftMs();

    function finishClose() {
      setChromeAway(false);
      unpinSubnavAfterFilter();
      unlockBodyScroll();
    }

    function revealSubnavThenFinish() {
      modalEl.classList.remove("is-closing");
      modalEl.hidden = true;
      setSubnavAway(false);
      if (!liftBackMs) {
        finishClose();
        return;
      }
      modalCloseTimer = window.setTimeout(function () {
        modalCloseTimer = null;
        if (!modalOpen) finishClose();
      }, liftBackMs);
    }

    if (!animMs) {
      revealSubnavThenFinish();
      return;
    }

    modalCloseTimer = window.setTimeout(function () {
      modalCloseTimer = null;
      if (modalOpen) return;
      revealSubnavThenFinish();
    }, animMs);
  }

  function updateTriggerText() {
    if (triggerTextEl) {
      triggerTextEl.textContent = getClientsLabel(activeClients);
    }
  }

  function updateUI() {
    updateTriggerText();
    filterEl.classList.toggle("is-active", isFilterActive());
    filterEl.classList.toggle("is-search-active", !!activeQuery);
    filterEl.classList.toggle("is-client-active", hasActiveClients());
    listEl.classList.toggle("is-client-filter-active", isFilterActive());
    setResetVisible(hasActiveClients() || sideFiltersSet());
    if (mobileBtn) {
      mobileBtn.classList.toggle("is-active", hasActiveClients() || modalOpen);
    }
    syncDraftClearButtons();
    if (menuOpen || modalOpen) {
      renderOptions();
    }
  }

  function clearDraftSelection() {
    draftClients = [];
    applyFilter([], { scroll: false });
  }

  function applyDraftAndClose() {
    if (!draftClients.length) return;
    var next = cloneIds(draftClients);
    if (isMobile()) {
      setModalOpen(false);
      applyFilter(next, { scroll: false });
      if (mobileBtn) focusEl(mobileBtn);
      return;
    }
    applyFilter(next, { scroll: false });
    setMenuOpen(false);
    blockFocusOpen = true;
    focusEl(searchInput || triggerEl);
    window.requestAnimationFrame(function () {
      scrollToFirstResult("smooth");
    });
  }

  function clearClientFilter() {
    draftClients = [];
    periodFrom = PERIOD_MIN;
    periodTo = PERIOD_MAX;
    activeVendors = [];
    applyFilter([], { scroll: false });
    setModalOpen(false);
    setMenuOpen(false);
    if (isMobile() && mobileBtn) focusEl(mobileBtn);
    else focusEl(triggerEl);
  }

  function clearAllFilters(options) {
    draftClients = [];
    periodFrom = PERIOD_MIN;
    periodTo = PERIOD_MAX;
    activeVendors = [];
    applyFilters({ clients: [], query: "" }, Object.assign({ mode: "query" }, options || {}));
  }

  function focusOptionAt(index) {
    var buttons = optionsEl.querySelectorAll(".projects-filter__option");
    if (!buttons.length) return;

    focusIndex = Math.max(0, Math.min(index, buttons.length - 1));
    buttons.forEach(function (btn, i) {
      btn.classList.toggle("is-focused", i === focusIndex);
    });
    buttons[focusIndex].focus();
    buttons[focusIndex].scrollIntoView({ block: "nearest" });
  }

  triggerEl.addEventListener("click", function () {
    if (isMobile()) {
      setModalOpen(!modalOpen);
      return;
    }
    setMenuOpen(!menuOpen);
  });

  if (searchWrap) {
    searchWrap.addEventListener("pointerdown", function (e) {
      if (isMobile()) return;
      var target = e.target;
      if (!target || !target.closest) return;
      if (target.closest(".projects-filter__search-toggle")) return;
      if (target.closest(".projects-filter__search-clear")) return;
      blockFocusOpen = false;
      if (!menuOpen) setMenuOpen(true);
    });
  }

  if (searchToggle) {
    searchToggle.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    searchToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (isMobile()) return;
      setMenuOpen(!menuOpen);
      if (menuOpen && searchInput) searchInput.focus();
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener("click", function () {
      setModalOpen(!modalOpen);
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function () {
      setModalOpen(false);
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", function () {
      setModalOpen(false);
      if (mobileBtn) mobileBtn.focus();
    });
  }

  optionsEl.addEventListener("keydown", function (e) {
    var buttons = optionsEl.querySelectorAll(".projects-filter__option");
    if (!buttons.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOptionAt(focusIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOptionAt(focusIndex <= 0 ? 0 : focusIndex - 1);
    } else if ((e.key === "Enter" || e.key === " ") && focusIndex >= 0) {
      e.preventDefault();
      var btn = buttons[focusIndex];
      toggleDraftClient(btn.dataset.clientId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
      triggerEl.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!menuOpen) return;
    var path = typeof e.composedPath === "function" ? e.composedPath() : [];
    var inside =
      (path.length && (path.indexOf(comboEl) !== -1 || (searchWrap && path.indexOf(searchWrap) !== -1))) ||
      comboEl.contains(e.target) ||
      (searchWrap && searchWrap.contains(e.target));
    if (!inside) setMenuOpen(false);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", clearDraftSelection);
  }

  if (menuClearBtn) {
    menuClearBtn.addEventListener("click", clearDraftSelection);
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", applyDraftAndClose);
  }

  if (menuApplyBtn) {
    menuApplyBtn.addEventListener("click", applyDraftAndClose);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", clearClientFilter);
  }

  if (periodFromInput && periodToInput) {
    periodToInput.style.zIndex = "3";
    periodFromInput.addEventListener("input", onPeriodInput);
    periodToInput.addEventListener("input", onPeriodInput);
  }

  var vendorsBox = document.getElementById("projects-vendors");
  if (vendorsBox) {
    vendorsBox.addEventListener("click", function (e) {
      var btn = e.target.closest(".projects-vendors__option");
      if (!btn || !vendorsBox.contains(btn)) return;
      var id = btn.getAttribute("data-vendor");
      if (!id) return;
      var idx = activeVendors.indexOf(id);
      if (idx === -1) activeVendors.push(id);
      else activeVendors.splice(idx, 1);
      applyFilters({}, { scroll: false });
      if (vendorIsSet()) {
        window.requestAnimationFrame(function () {
          scrollToFirstResult("smooth");
        });
      }
    });
  }

  var blockFocusOpen = false;

  window.addEventListener("blur", function () {
    blockFocusOpen = true;
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") blockFocusOpen = true;
  });

  if (searchInput) {
    searchInput.addEventListener("pointerdown", function () {
      blockFocusOpen = false;
      if (!isMobile() && !menuOpen && document.activeElement === searchInput) setMenuOpen(true);
    });

    searchInput.addEventListener("focus", function () {
      if (blockFocusOpen) {
        blockFocusOpen = false;
        return;
      }
      if (isMobile() || menuOpen) return;
      setMenuOpen(true);
    });

    searchInput.addEventListener("input", function () {
      var raw = String(searchInput.value || "").replace(/[\u0000-\u001F\u007F]/g, "");
      if (raw.length > QUERY_MAX) raw = raw.slice(0, QUERY_MAX);
      if (searchInput.value !== raw) {
        var start = searchInput.selectionStart;
        searchInput.value = raw;
        if (typeof start === "number") {
          searchInput.setSelectionRange(Math.min(start, raw.length), Math.min(start, raw.length));
        }
      }
      var hasText = !!raw.replace(/\s+/g, " ").trim();
      if (searchClearBtn) searchClearBtn.hidden = !hasText;
      if (searchWrap) searchWrap.classList.toggle("is-active", hasText);
      if (isMobile()) {
        scheduleSearchFromInput();
        return;
      }
      optionQuery = raw.replace(/\s+/g, " ").trim();
      if (!menuOpen) setMenuOpen(true);
      else renderOptions();
    });

    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isMobile()) flushSearchFromInput();
      } else if (e.key === "Escape") {
        if (menuOpen && !isMobile()) {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(false);
          return;
        }
        e.preventDefault();
        if (activeQuery || searchInput.value) {
          applySearch("", { scroll: false });
        }
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", function () {
      if (!isMobile()) {
        optionQuery = "";
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        searchClearBtn.hidden = true;
        if (searchWrap) searchWrap.classList.remove("is-active");
        renderOptions();
        return;
      }
      applySearch("", { scroll: false });
      if (searchInput) searchInput.focus();
    });
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener("click", function () {
      var wasSearch = !!activeQuery;
      clearAllFilters({ scroll: false });
      if (wasSearch && searchInput) searchInput.focus();
      else if (isMobile() && mobileBtn) mobileBtn.focus();
      else triggerEl.focus();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") blockFocusOpen = false;
    if (e.key !== "Escape") return;

    if (modalOpen) {
      setModalOpen(false);
      if (mobileBtn) mobileBtn.focus();
      return;
    }

    if (menuOpen) {
      setMenuOpen(false);
      blockFocusOpen = true;
      if (!isMobile() && searchInput) searchInput.focus();
      else triggerEl.focus();
      return;
    }

    if (document.activeElement === searchInput || activeQuery) {
      if (activeQuery || (searchInput && searchInput.value)) {
        applySearch("", { scroll: false });
        if (searchInput) searchInput.focus();
      }
      return;
    }

    if (hasActiveClients()) {
      applyFilter([], { scroll: false });
      if (isMobile() && mobileBtn) mobileBtn.focus();
      else triggerEl.focus();
    }
  });

  function onViewportChange() {
    if (isMobile()) {
      clearMenuCloseTimer();
      menuOpen = false;
      comboEl.classList.remove("is-open");
      menuEl.classList.remove("is-open", "is-closing");
      menuEl.hidden = true;
      triggerEl.setAttribute("aria-expanded", "false");
    } else {
      setModalOpen(false);
    }
  }

  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", onViewportChange);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(onViewportChange);
  }

  window.addEventListener("popstate", function (e) {
    var url = new URL(window.location.href);
    var rawQ = sanitizeQuery(
      (e.state && e.state.q) || url.searchParams.get(PARAM_QUERY) || ""
    );
    var rawClients =
      (e.state && (e.state.clients || e.state.client)) ||
      url.searchParams.get(PARAM_CLIENT) ||
      "";

    if (rawQ) {
      readPeriodFromUrl(url);
      applySearch(rawQ, { updateUrl: false });
    } else {
      readPeriodFromUrl(url);
      applyFilter(resolveClientParams(rawClients), { updateUrl: false });
    }
  });

  function init() {
    assignClientKeys();
    clients = loadClients();

    if (!clients.length) {
      filterEl.hidden = true;
      return;
    }

    filterEl.hidden = false;

    var url = new URL(window.location.href);
    readPeriodFromUrl(url);
    var fromQuery = sanitizeQuery(url.searchParams.get(PARAM_QUERY) || "");
    var fromClients = resolveClientParams(url.searchParams.get(PARAM_CLIENT) || "");
    var shouldScroll = window.location.hash === "#projects-all" ? "auto" : "smooth";

    if (fromQuery) {
      applySearch(fromQuery, {
        updateUrl: false,
        scroll: shouldScroll,
      });
    } else if (fromClients.length) {
      applyFilter(fromClients, {
        updateUrl: false,
        scroll: shouldScroll,
      });
    } else {
      applyFilters({ clients: [], query: "" }, { mode: "query", updateUrl: false });
    }
  }

  function run() {
    if (window.enhanceProjectCards) {
      window.enhanceProjectCards(document);
    }
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
