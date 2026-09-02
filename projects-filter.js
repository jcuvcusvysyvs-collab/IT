/**
 * Фильтр каталога проектов по заказчику — projects.html?client=<id>
 */
(function () {
  var PARAM = "client";
  var ALL_LABEL = "Все заказчики";

  var filterEl = document.getElementById("projects-filter");
  var comboEl = document.getElementById("projects-filter-combo");
  var triggerEl = document.getElementById("projects-filter-trigger");
  var triggerTextEl = document.getElementById("projects-filter-trigger-text");
  var menuEl = document.getElementById("projects-filter-menu");
  var optionsEl = document.getElementById("projects-filter-options");
  var clearBtn = document.getElementById("projects-filter-clear");
  var listEl = document.getElementById("projects-list");

  if (!filterEl || !comboEl || !triggerEl || !menuEl || !optionsEl || !listEl) return;

  var activeClient = "";
  var clients = [];
  var clientNames = {};
  var menuOpen = false;
  var focusIndex = -1;

  function stripHtml(html) {
    return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function plainText(el) {
    return stripHtml(el ? el.textContent || el.innerHTML : "");
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

  function updateYearCounts() {
    listEl.querySelectorAll(".page-projects__year-group").forEach(function (group) {
      var countEl = group.querySelector(".page-projects__year-count");
      if (!countEl) return;

      var selector = activeClient
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

  function hasClientInList(clientId) {
    if (!clientId) return true;
    return clients.some(function (client) {
      return client.id === clientId;
    });
  }

  function applyFilter(clientId, options) {
    var opts = options || {};
    activeClient = clientId || "";

    listEl.querySelectorAll(".page-projects__item").forEach(function (item) {
      var match = itemMatchesClient(item, activeClient);
      item.classList.toggle("is-filtered-out", !match);
    });

    listEl.querySelectorAll(".page-projects__year-group").forEach(function (group) {
      var visible = group.querySelectorAll(".page-projects__item:not(.is-filtered-out)").length;
      group.classList.toggle("is-filtered-empty", visible === 0);
    });

    updateYearCounts();
    updateUI();

    if (opts.updateUrl !== false) {
      var url = new URL(window.location.href);
      if (activeClient) {
        url.searchParams.set(PARAM, activeClient);
      } else {
        url.searchParams.delete(PARAM);
      }
      url.hash = "projects-all";
      history.replaceState({ client: activeClient }, "", url.toString());
    }

    if (opts.scroll && activeClient) {
      var top = filterEl.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: top, behavior: opts.scroll === "smooth" ? "smooth" : "auto" });
    }
  }

  function renderOptions() {
    var visible = [{ id: "", name: ALL_LABEL }].concat(clients);
    optionsEl.replaceChildren();
    focusIndex = -1;

    visible.forEach(function (item) {
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "projects-filter__option";
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
      optionsEl.appendChild(li);
    });
  }

  function setMenuOpen(open) {
    menuOpen = open;
    comboEl.classList.toggle("is-open", open);
    triggerEl.setAttribute("aria-expanded", open ? "true" : "false");
    menuEl.hidden = !open;

    if (open) {
      renderOptions();
      var firstFocus =
        optionsEl.querySelector(".projects-filter__option.is-selected") ||
        optionsEl.querySelector(".projects-filter__option");
      if (firstFocus) firstFocus.focus();
    } else {
      focusIndex = -1;
    }
  }

  function updateTriggerText() {
    if (triggerTextEl) {
      triggerTextEl.textContent = getClientFullName(activeClient);
    }
  }

  function updateUI() {
    updateTriggerText();
    filterEl.classList.toggle("is-active", !!activeClient);
    listEl.classList.toggle("is-client-filter-active", !!activeClient);
    if (clearBtn) clearBtn.hidden = !activeClient;
    renderOptions();
  }

  function selectClient(clientId, options) {
    applyFilter(clientId || "", options);
    setMenuOpen(false);
    triggerEl.focus();
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
    setMenuOpen(!menuOpen);
  });

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
      triggerEl.focus();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (menuOpen) {
        setMenuOpen(false);
        triggerEl.focus();
        return;
      }
      if (activeClient) {
        applyFilter("");
        triggerEl.focus();
      }
    }
  });

  window.addEventListener("popstate", function (e) {
    var raw =
      (e.state && e.state.client) || new URL(window.location.href).searchParams.get(PARAM) || "";
    applyFilter(resolveClientParam(raw), { updateUrl: false });
  });

  function init() {
    assignClientKeys();
    clients = loadClients();

    if (!clients.length) {
      filterEl.hidden = true;
      return;
    }

    filterEl.hidden = false;

    var fromUrl = resolveClientParam(
      new URL(window.location.href).searchParams.get(PARAM) || ""
    );
    if (fromUrl) {
      applyFilter(fromUrl, {
        updateUrl: false,
        scroll: window.location.hash === "#projects-all" ? "auto" : "smooth",
      });
    } else {
      applyFilter("", { updateUrl: false });
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
