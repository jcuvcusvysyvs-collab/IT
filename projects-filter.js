/**
 * Фильтр и поиск заказчика — projects.html?client=<id> | ?q=<query>
 * Desktop: объединённый бар (поиск + дропдаун). Mobile: поиск + кнопка → модалка.
 * Режимы взаимно исключающие.
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

  var activeClient = "";
  var activeQuery = "";
  var clients = [];
  var clientNames = {};
  var menuOpen = false;
  var modalOpen = false;
  var focusIndex = -1;
  var searchTimer = null;
  var mobileMq = window.matchMedia(MOBILE_MQ);
  var lastFocusEl = null;

  function isMobile() {
    return mobileMq.matches;
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

  function resolveClientParam(clientId) {
    if (!clientId) return "";
    if (hasClientInList(clientId)) return clientId;

    var c = window.DCE_CLIENTS && window.DCE_CLIENTS[clientId];
    if (c && c.name) {
      var byName = normalizeClientKey(c.name);
      if (hasClientInList(byName)) return byName;
    }

    return "";
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

  function formatProjectCount(n) {
    return n + " " + pluralProjects(n);
  }

  function isFilterActive() {
    return !!(activeClient || activeQuery);
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

  function itemMatchesClient(item, clientId) {
    if (!clientId) return true;
    var key = item.getAttribute("data-project-client-key") || getItemClientKey(item);
    return key === clientId;
  }

  function itemMatchesQuery(item, query) {
    if (!query) return true;
    var name = getItemClientName(item);
    if (!name) return false;
    return normalizeForSearch(name).indexOf(normalizeForSearch(query)) !== -1;
  }

  function itemMatches(item) {
    if (activeQuery) return itemMatchesQuery(item, activeQuery);
    if (activeClient) return itemMatchesClient(item, activeClient);
    return true;
  }

  function hasClientInList(clientId) {
    if (!clientId) return true;
    return clients.some(function (client) {
      return client.id === clientId;
    });
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
    var nextClient = state && "client" in state ? state.client || "" : activeClient;
    var nextQuery = state && "query" in state ? sanitizeQuery(state.query) : activeQuery;

    if (opts.mode === "query" || (state && "query" in state && !("client" in state))) {
      activeQuery = nextQuery;
      activeClient = "";
    } else if (opts.mode === "client" || (state && "client" in state && !("query" in state))) {
      activeClient = nextClient || "";
      activeQuery = "";
    } else if (state && "query" in state && "client" in state) {
      if (nextQuery) {
        activeQuery = nextQuery;
        activeClient = "";
      } else {
        activeClient = nextClient || "";
        activeQuery = "";
      }
    }

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
      if (activeClient) {
        url.searchParams.set(PARAM_CLIENT, activeClient);
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
        { client: activeClient, q: activeQuery },
        "",
        url.toString()
      );
    }

    if (opts.scroll && (activeClient || activeQuery)) {
      var top = filterEl.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: top, behavior: opts.scroll === "smooth" ? "smooth" : "auto" });
    }
  }

  function applyFilter(clientId, options) {
    applyFilters({ client: clientId || "" }, Object.assign({ mode: "client" }, options || {}));
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

    var visible = [{ id: "", name: ALL_LABEL }].concat(clients);
    visible.forEach(function (item) {
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        targetEl === modalOptionsEl
          ? "projects-filter-modal__option"
          : "projects-filter__option";
      btn.setAttribute("role", "option");
      btn.dataset.clientId = item.id;
      btn.textContent = item.name;
      btn.setAttribute("aria-selected", item.id === activeClient ? "true" : "false");

      if (item.id === activeClient) {
        btn.classList.add("is-selected");
      }

      btn.addEventListener("click", function () {
        selectClient(item.id, { scroll: !!item.id });
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

  function setMenuOpen(open) {
    if (isMobile()) {
      if (open) setModalOpen(true);
      else setModalOpen(false);
      return;
    }

    menuOpen = !!open;
    comboEl.classList.toggle("is-open", menuOpen);
    triggerEl.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    menuEl.hidden = !menuOpen;

    if (menuOpen) {
      if (modalEl) {
        modalOpen = false;
        modalEl.hidden = true;
        document.body.classList.remove("projects-filter-modal-open");
      }
      renderOptions();
      var firstFocus =
        optionsEl.querySelector(".projects-filter__option.is-selected") ||
        optionsEl.querySelector(".projects-filter__option");
      if (firstFocus) firstFocus.focus();
    } else {
      focusIndex = -1;
    }
  }

  function setModalOpen(open) {
    if (!modalEl) return;

    modalOpen = !!open;
    modalEl.hidden = !modalOpen;
    document.body.classList.toggle("projects-filter-modal-open", modalOpen);

    if (mobileBtn) {
      mobileBtn.setAttribute("aria-expanded", modalOpen ? "true" : "false");
      mobileBtn.classList.toggle("is-active", modalOpen || !!activeClient);
    }

    if (modalOpen) {
      menuOpen = false;
      comboEl.classList.remove("is-open");
      triggerEl.setAttribute("aria-expanded", "false");
      menuEl.hidden = true;

      lastFocusEl = document.activeElement;
      renderOptions();
      var firstFocus =
        modalOptionsEl &&
        (modalOptionsEl.querySelector(".projects-filter-modal__option.is-selected") ||
          modalOptionsEl.querySelector(".projects-filter-modal__option"));
      if (firstFocus) firstFocus.focus();
    } else if (lastFocusEl && typeof lastFocusEl.focus === "function") {
      lastFocusEl.focus();
      lastFocusEl = null;
    }
  }

  function updateTriggerText() {
    if (triggerTextEl) {
      triggerTextEl.textContent = getClientFullName(activeClient);
    }
  }

  function updateUI() {
    updateTriggerText();
    filterEl.classList.toggle("is-active", isFilterActive());
    filterEl.classList.toggle("is-search-active", !!activeQuery);
    filterEl.classList.toggle("is-client-active", !!activeClient);
    listEl.classList.toggle("is-client-filter-active", isFilterActive());
    if (clearBtn) clearBtn.hidden = !activeClient;
    if (mobileBtn) {
      mobileBtn.classList.toggle("is-active", !!activeClient || modalOpen);
    }
    renderOptions();
  }

  function selectClient(clientId, options) {
    applyFilter(clientId || "", options);
    setMenuOpen(false);
    setModalOpen(false);
    if (isMobile() && mobileBtn) mobileBtn.focus();
    else triggerEl.focus();
  }

  function clearAllFilters(options) {
    applyFilters({ client: "", query: "" }, Object.assign({ mode: "query" }, options || {}));
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
    } else if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault();
      var btn = buttons[focusIndex];
      selectClient(btn.dataset.clientId, { scroll: !!btn.dataset.clientId });
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
      triggerEl.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!menuOpen) return;
    if (!comboEl.contains(e.target)) {
      setMenuOpen(false);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      applyFilter("", { scroll: false });
      setModalOpen(false);
      if (isMobile() && mobileBtn) mobileBtn.focus();
      else triggerEl.focus();
    });
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

    if (activeClient) {
      applyFilter("");
      if (isMobile() && mobileBtn) mobileBtn.focus();
      else triggerEl.focus();
    }
  });

  function onViewportChange() {
    if (isMobile()) {
      setMenuOpen(false);
      menuOpen = false;
      comboEl.classList.remove("is-open");
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
    var rawClient =
      (e.state && e.state.client) || url.searchParams.get(PARAM_CLIENT) || "";

    if (rawQ) {
      applySearch(rawQ, { updateUrl: false });
    } else {
      applyFilter(resolveClientParam(rawClient), { updateUrl: false });
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
    var fromClient = resolveClientParam(url.searchParams.get(PARAM_CLIENT) || "");
    var shouldScroll = window.location.hash === "#projects-all" ? "auto" : "smooth";

    if (fromQuery) {
      applySearch(fromQuery, {
        updateUrl: false,
        scroll: shouldScroll,
      });
    } else if (fromClient) {
      applyFilter(fromClient, {
        updateUrl: false,
        scroll: shouldScroll,
      });
    } else {
      applyFilters({ client: "", query: "" }, { mode: "query", updateUrl: false });
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
