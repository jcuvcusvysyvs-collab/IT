/**
 * Фильтр и поиск заказчика — projects.html?client=<id>[,id2] | ?q=<query>
 * Мультивыбор заказчиков (галочки) + «Применить».
 * Desktop: поиск + дропдаун. Mobile: поиск + кнопка → модалка.
 * Режимы взаимно исключающие (поиск ИЛИ заказчики).
 */
(function () {
  var PARAM_CLIENT = "client";
  var PARAM_QUERY = "q";
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
  var listEl = document.getElementById("projects-list");
  var searchWrap = document.getElementById("projects-filter-search");
  var searchInput = document.getElementById("projects-search");
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
          if (hasActiveClients()) resetBtn.classList.add("is-visible");
        });
      });
      return;
    }

    resetBtn.classList.remove("is-visible");
    resetBtn.setAttribute("aria-hidden", "true");
    resetHideTimer = window.setTimeout(function () {
      resetHideTimer = null;
      if (!hasActiveClients()) resetBtn.hidden = true;
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
    var canClear = draftClients.length > 0;
    [clearBtn, menuClearBtn].forEach(function (btn) {
      if (!btn) return;
      btn.disabled = !canClear;
      btn.setAttribute("aria-disabled", canClear ? "false" : "true");
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

  function itemMatchesQuery(item, query) {
    if (!query) return true;
    var name = getItemClientName(item);
    if (!name) return false;
    return normalizeForSearch(name).indexOf(normalizeForSearch(query)) !== -1;
  }

  function itemMatches(item) {
    if (activeQuery) return itemMatchesQuery(item, activeQuery);
    if (hasActiveClients()) return itemMatchesClients(item, activeClients);
    return true;
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
    var show = isFilterActive() && visibleCount === 0;
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
      url.hash = "projects-all";
      history.replaceState(
        { client: clientParam, clients: cloneIds(activeClients), q: activeQuery },
        "",
        url.toString()
      );
    }

    if (opts.scroll && (hasActiveClients() || activeQuery)) {
      var top = filterEl.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: top, behavior: opts.scroll === "smooth" ? "smooth" : "auto" });
    }
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

    if (menuOpen) {
      if (modalEl && (modalOpen || !modalEl.hidden)) {
        setModalOpen(false);
      }

      beginDraftFromActive();
      renderOptions();

      menuEl.hidden = false;
      menuEl.classList.remove("is-closing", "is-open");
      comboEl.classList.add("is-open");

      /* Два кадра: сначала стартовое состояние, потом is-open — иначе transition срывается */
      void menuEl.offsetWidth;
      window.requestAnimationFrame(function () {
        if (!menuOpen) return;
        window.requestAnimationFrame(function () {
          if (!menuOpen) return;
          menuEl.classList.add("is-open");
        });
      });

      var firstFocus =
        optionsEl.querySelector(".projects-filter__option.is-selected") ||
        optionsEl.querySelector(".projects-filter__option");
      if (firstFocus) firstFocus.focus();
      return;
    }

    comboEl.classList.remove("is-open");
    menuEl.classList.remove("is-open");
    menuEl.classList.add("is-closing");
    focusIndex = -1;
    draftClients = cloneIds(activeClients);

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
    setResetVisible(hasActiveClients());
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
    syncDraftUI();
  }

  function applyDraftAndClose() {
    var next = cloneIds(draftClients);
    if (isMobile()) {
      setModalOpen(false);
      applyFilter(next, { scroll: false });
      if (mobileBtn) focusEl(mobileBtn);
      return;
    }
    applyFilter(next, { scroll: false });
    setMenuOpen(false);
    focusEl(triggerEl);
  }

  function clearClientFilter() {
    draftClients = [];
    applyFilter([], { scroll: false });
    setModalOpen(false);
    setMenuOpen(false);
    if (isMobile() && mobileBtn) focusEl(mobileBtn);
    else focusEl(triggerEl);
  }

  function clearAllFilters(options) {
    draftClients = [];
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
      (path.length && path.indexOf(comboEl) !== -1) || comboEl.contains(e.target);
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

  if (searchInput) {
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
      scheduleSearchFromInput();
    });

    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        flushSearchFromInput();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (activeQuery || searchInput.value) {
          applySearch("", { scroll: false });
        }
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", function () {
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
    if (e.key !== "Escape") return;

    if (modalOpen) {
      setModalOpen(false);
      if (mobileBtn) mobileBtn.focus();
      return;
    }

    if (menuOpen) {
      setMenuOpen(false);
      triggerEl.focus();
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
      applySearch(rawQ, { updateUrl: false });
    } else {
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
