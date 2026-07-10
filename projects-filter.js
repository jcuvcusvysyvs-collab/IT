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
  var menuOpen = false;
  var focusIndex = -1;

  function stripHtml(html) {
    return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
    var c = window.DCE_CLIENTS && window.DCE_CLIENTS[id];
    if (c && c.name) return stripHtml(c.name);
    return id;
  }

  function loadClients() {
    if (!window.DCE_CLIENTS || typeof window.getClientProjectCount !== "function") return [];

    return Object.keys(window.DCE_CLIENTS)
      .map(function (id) {
        return {
          id: id,
          name: getClientFullName(id),
          count: window.getClientProjectCount(id),
        };
      })
      .filter(function (c) {
        return c.count >= 2;
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name, "ru");
      });
  }

  function applyFilter(clientId, options) {
    var opts = options || {};
    activeClient = clientId || "";

    listEl.querySelectorAll(".page-projects__item").forEach(function (item) {
      var match = !activeClient || item.getAttribute("data-client") === activeClient;
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
    var id =
      (e.state && e.state.client) || new URL(window.location.href).searchParams.get(PARAM) || "";
    applyFilter(id, { updateUrl: false });
  });

  function init() {
    clients = loadClients();

    if (!clients.length) {
      filterEl.hidden = true;
      return;
    }

    filterEl.hidden = false;

    var fromUrl = new URL(window.location.href).searchParams.get(PARAM) || "";
    if (fromUrl && window.DCE_CLIENTS && window.DCE_CLIENTS[fromUrl]) {
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
