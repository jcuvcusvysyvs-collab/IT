(function () {
  var serviceMenuData = {
    "infrastructure-solutions.html": {
      title: "Инфраструктурные решения",
      desc: "Вычислительные комплексы, СХД, сети передачи данных и встраивание в текущий ИТ-ландшафт.",
      image: "images/menu_01.png",
    },
    "information-security.html": {
      title: "Информационная безопасность",
      desc: "Контуры безопасности, соответствие регуляторным требованиям и сопровождение сертифицированных решений.",
      image: "images/menu_02.png",
    },
    "scaling-without-procurement.html": {
      title: "Масштабирование без закупок",
      desc: "Рост ёмкости и отказоустойчивости за счёт архитектуры, без проведения закупочных процедур.",
      image: "images/menu_03.png",
    },
    "business-continuity.html": {
      title: "Обеспечение непрерывности",
      desc: "Проектирование отказоустойчивости, резервирование и планы восстановления после сбоев.",
      image: "images/menu_04.png",
    },
    "operations-support.html": {
      title: "Эксплуатация и сопровождение",
      desc: "Поддержка, мониторинг, обновления и развитие инфраструктуры под согласованным SLA.",
      image: "images/menu_05.png",
    },
    "huawei-service-center.html": {
      title: "Сервисный центр HUAWEI",
      desc: "Официальный сервис и поддержка оборудования Huawei: диагностика, ремонт и сопровождение.",
      image: "images/menu_06.png",
    },
    "asdu-datacenter.html": {
      title: "АСДУ",
      desc: "Автоматизированные системы диспетчерского управления на базе SCADA+",
      image: "images/menu_07.png",
    },
  };

  function enhanceServicesMegaMenu() {
    var menu = document.getElementById("submenu-services");
    if (!menu) return;

    var list = menu.querySelector(".nav-submenu-links");
    if (!list) return;

    var feature = menu.querySelector(".nav-submenu-feature");
    if (feature) {
      feature.remove();
    }

    list.classList.add("nav-submenu-links--rich");

    list.querySelectorAll("a[href]").forEach(function (link) {
      if (link.classList.contains("nav-submenu-feature")) return;

      var href = link.getAttribute("href") || "";
      var file = href.split("/").pop().split("?")[0];
      var data = serviceMenuData[file];
      if (!data) return;

      link.classList.add("nav-submenu-card");
      link.classList.remove("nav-submenu-card--huawei");
      if (data.image) {
        link.classList.add("nav-submenu-card--visual");
      } else {
        link.classList.remove("nav-submenu-card--visual");
      }
      link.textContent = "";

      if (data.image) {
        var media = document.createElement("span");
        media.className = "nav-submenu-card__media";
        var img = document.createElement("img");
        img.src = data.image;
        img.alt = "";
        img.width = 52;
        img.height = 52;
        img.decoding = "async";
        img.loading = "lazy";
        media.appendChild(img);
        link.appendChild(media);
      }

      var body = document.createElement("span");
      body.className = "nav-submenu-card__body";

      var title = document.createElement("span");
      title.className = "nav-submenu-card__title";
      title.textContent = data.title;

      var desc = document.createElement("span");
      desc.className = "nav-submenu-card__desc";
      desc.textContent = data.desc;

      body.appendChild(title);
      body.appendChild(desc);
      link.appendChild(body);
    });
  }

  enhanceServicesMegaMenu();

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  var submenuItems = document.querySelectorAll(".nav-item-has-submenu");
  var header = document.querySelector(".site-header");
  var syncMegaMenuPosition = null;
  var syncAboutMenuPosition = null;
  var syncProjectsMenuPosition = null;
  var mobileBackdrop = null;
  var mobileMq = window.matchMedia("(max-width: 768px)");
  var closeAllSubmenusRef = null;

  function isMobileNavViewport() {
    return mobileMq.matches;
  }

  var mobileScrollLockY = 0;

  function setMobileNavOpen(open) {
    if (!nav || !toggle) return;

    var shouldLockScroll = open && isMobileNavViewport();

    nav.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-mobile-open", shouldLockScroll);
    document.body.classList.toggle("nav-mobile-open", shouldLockScroll);

    if (shouldLockScroll) {
      mobileScrollLockY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + mobileScrollLockY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else if (document.body.style.position === "fixed") {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, mobileScrollLockY);
    }

    if (mobileBackdrop) {
      mobileBackdrop.classList.toggle("is-visible", shouldLockScroll);
    }

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");

    if (header && open) {
      header.classList.remove("site-header--hidden");
    }

    if (!open && closeAllSubmenusRef) {
      if (menu && menu.classList.contains("nav-menu--drill")) {
        menu.classList.remove("nav-menu--drill");
        menu.querySelectorAll(".nav-item-drill.is-open").forEach(function (drillItem) {
          drillItem.classList.remove("is-open");
          var drillTrigger = drillItem.querySelector(".nav-submenu-trigger");
          if (drillTrigger) {
            drillTrigger.setAttribute("aria-expanded", "false");
          }
        });
      } else {
        closeAllSubmenusRef();
      }
    }
  }

  function injectMobileNavCta() {
    if (!menu || menu.querySelector(".nav-mobile-cta")) return;

    var item = document.createElement("li");
    item.className = "nav-mobile-cta";

    var link = document.createElement("a");
    link.href = "contacts.html";
    link.textContent = "Контакты";
    item.appendChild(link);
    menu.appendChild(item);
  }

  injectMobileNavCta();

  function unwrapMobileNavStack() {
    if (!menu) return;

    var stack = menu.querySelector(".nav-mobile-panels");
    if (!stack) return;

    var root = stack.querySelector(".nav-mobile-panel--root");
    if (root) {
      while (root.firstChild) {
        menu.insertBefore(root.firstChild, stack);
      }
    }

    stack.remove();
  }

  unwrapMobileNavStack();

  if (toggle && menu && nav) {
    mobileBackdrop = document.createElement("div");
    mobileBackdrop.className = "nav-mobile-backdrop";
    mobileBackdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(mobileBackdrop);

    mobileBackdrop.addEventListener("click", function () {
      setMobileNavOpen(false);
    });

    toggle.addEventListener("click", function () {
      setMobileNavOpen(!nav.classList.contains("is-open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileNavOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open") && isMobileNavViewport()) {
        if (menu && menu.classList.contains("nav-menu--drill")) return;
        setMobileNavOpen(false);
      }
    });

    mobileMq.addEventListener("change", function () {
      if (!mobileMq.matches) {
        setMobileNavOpen(false);
      }
    });
  }

  if (submenuItems.length) {
    var mq = window.matchMedia("(max-width: 768px)");
    var servicesItem = document.querySelector("#submenu-services")?.closest(".nav-item-has-submenu");
    var projectsItem = document.querySelector("#submenu-projects")?.closest(".nav-item-has-submenu");
    var aboutItem = document.querySelector("#submenu-about")?.closest(".nav-item-has-submenu");
    var projectsSubmenu = document.getElementById("submenu-projects");
    var aboutSubmenu = document.getElementById("submenu-about");
    var megaBackdrop = null;
    var drillMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var drillClosing = false;

    function getDrillLabel(item) {
      var trigger = item && item.querySelector(".nav-submenu-trigger");
      if (!trigger) return "Назад";

      var label = "";
      trigger.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          label += node.textContent;
        }
      });

      return label.trim() || "Назад";
    }

    function getOpenDrillItem() {
      return menu ? menu.querySelector(".nav-item-drill.is-open") : null;
    }

    function waitForDrillTransition(item, callback) {
      if (!item || drillMotionQuery.matches) {
        callback();
        return;
      }

      var submenu = item.querySelector(".nav-submenu");
      if (!submenu) {
        callback();
        return;
      }

      var done = false;

      function finish() {
        if (done) return;
        done = true;
        submenu.removeEventListener("transitionend", onEnd);
        window.clearTimeout(fallback);
        callback();
      }

      function onEnd(e) {
        if (e.target === submenu && e.propertyName === "transform") {
          finish();
        }
      }

      var fallback = window.setTimeout(finish, 350);
      submenu.addEventListener("transitionend", onEnd);
    }

    function closeDrillAnimated(item, callback) {
      if (!menu || !item) {
        if (callback) callback();
        return;
      }

      if (!menu.classList.contains("nav-menu--drill") || !item.classList.contains("is-open")) {
        closeSubmenu(item);
        if (callback) callback();
        return;
      }

      if (drillClosing) return;
      drillClosing = true;
      menu.classList.remove("nav-menu--drill");

      waitForDrillTransition(item, function () {
        var trigger = item.querySelector(".nav-submenu-trigger");
        item.classList.remove("is-open");
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
        drillClosing = false;
        if (callback) callback();
      });
    }

    if (servicesItem) {
      servicesItem.classList.add("nav-item-services");
    }

    if (projectsItem && projectsSubmenu) {
      projectsItem.classList.add("nav-item-projects");
    }

    if (aboutItem && aboutSubmenu) {
      aboutItem.classList.add("nav-item-about");
    }

    if (servicesItem || projectsItem || aboutItem) {
      megaBackdrop = document.createElement("div");
      megaBackdrop.className = "nav-mega-backdrop";
      megaBackdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(megaBackdrop);
    }

    syncMegaMenuPosition = function () {
      if (!servicesItem || mq.matches) {
        var megaReset = servicesItem && servicesItem.querySelector(".nav-submenu--mega");
        if (megaReset) {
          megaReset.style.removeProperty("--nav-mega-left");
          megaReset.style.removeProperty("--nav-mega-bridge");
        }
        return;
      }

      var mega = servicesItem.querySelector(".nav-submenu--mega");
      var trigger = servicesItem.querySelector(".nav-submenu-trigger");
      if (!mega || !trigger) return;

      var triggerRect = trigger.getBoundingClientRect();
      var headerHeight = header
        ? header.getBoundingClientRect().height
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 72;
      var megaWidth = mega.getBoundingClientRect().width || mega.offsetWidth || 736;
      var gutter = 18;
      var left = triggerRect.left;
      var maxLeft = window.innerWidth - megaWidth - gutter;
      left = Math.max(gutter, Math.min(left, maxLeft));

      var gap =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-dropdown-gap")) || 10;
      var megaTop = headerHeight + gap;
      var bridgeHeight = Math.max(8, megaTop - triggerRect.bottom + 2);

      mega.style.setProperty("--nav-mega-left", left + "px");
      mega.style.setProperty("--nav-mega-bridge", bridgeHeight + "px");
    };

    function syncPanelMenuPosition(item, submenu) {
      if (!item || !submenu || mq.matches) {
        if (submenu) {
          submenu.style.removeProperty("--nav-panel-left");
          submenu.style.removeProperty("--nav-panel-bridge");
        }
        return;
      }

      var trigger = item.querySelector(".nav-submenu-trigger");
      if (!trigger) return;

      var triggerRect = trigger.getBoundingClientRect();
      var headerHeight = header
        ? header.getBoundingClientRect().height
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 72;
      var submenuWidth = submenu.getBoundingClientRect().width || submenu.offsetWidth || 208;
      var gutter = 18;
      var gap =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-dropdown-gap")) || 10;
      var submenuTop = headerHeight + gap;
      var bridgeHeight = Math.max(8, submenuTop - triggerRect.bottom + 2);
      var left = triggerRect.left;
      var maxLeft = window.innerWidth - submenuWidth - gutter;
      left = Math.max(gutter, Math.min(left, maxLeft));

      submenu.style.setProperty("--nav-panel-left", left + "px");
      submenu.style.setProperty("--nav-panel-bridge", bridgeHeight + "px");
    }

    syncAboutMenuPosition = function () {
      syncPanelMenuPosition(aboutItem, aboutSubmenu);
    };

    syncProjectsMenuPosition = function () {
      syncPanelMenuPosition(projectsItem, projectsSubmenu);
    };

    function syncNavDropdowns() {
      syncMegaMenuPosition();
      syncProjectsMenuPosition();
      if (syncAboutMenuPosition) {
        syncAboutMenuPosition();
      }
    }

    function isSubmenuActive(item) {
      if (!item) return false;
      if (item.classList.contains("is-open")) return true;
      if (!mq.matches) return item.matches(":hover");
      return false;
    }

    function syncMegaBackdrop() {
      syncNavDropdowns();
      if (!megaBackdrop) return;
      var show =
        isSubmenuActive(servicesItem) ||
        isSubmenuActive(projectsItem) ||
        isSubmenuActive(aboutItem);
      document.body.classList.toggle("nav-mega-open", show);
    }

    function closeSubmenu(item) {
      if (
        item &&
        item.classList.contains("nav-item-drill") &&
        menu &&
        menu.classList.contains("nav-menu--drill") &&
        item.classList.contains("is-open")
      ) {
        closeDrillAnimated(item);
        return;
      }

      var trigger = item.querySelector(".nav-submenu-trigger");
      item.classList.remove("is-open");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
      syncMegaBackdrop();
    }

    function closeAllSubmenus(except) {
      submenuItems.forEach(function (item) {
        if (item !== except) {
          closeSubmenu(item);
        }
      });
    }

    closeAllSubmenusRef = function () {
      var openDrillItem = getOpenDrillItem();
      if (menu && menu.classList.contains("nav-menu--drill") && openDrillItem) {
        closeDrillAnimated(openDrillItem, function () {
          closeAllSubmenus(null);
        });
        return;
      }
      closeAllSubmenus(null);
    };

    function ensureDrillBack(item) {
      if (!item) return null;

      var submenu = item.querySelector(".nav-submenu");
      if (!submenu) return null;

      var panel = submenu.querySelector(".nav-submenu-panel") || submenu;
      var backBtn = panel.querySelector(".nav-mobile-drill-back");
      var label = getDrillLabel(item);

      if (!backBtn) {
        backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "nav-mobile-drill-back";
        backBtn.setAttribute("aria-label", "Назад к меню");
        backBtn.innerHTML =
          '<svg class="nav-mobile-drill-back__icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
          '<path d="M7.5 2.5 4 6l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />' +
          "</svg>" +
          "<span></span>";
        panel.insertBefore(backBtn, panel.firstChild);

        backBtn.addEventListener("click", function () {
          closeAllSubmenusRef();
        });
      }

      var labelEl = backBtn.querySelector("span");
      if (labelEl) {
        labelEl.textContent = label;
      }

      return backBtn;
    }

    function startDrill(item) {
      if (!menu || !item) return;

      ensureDrillBack(item);

      submenuItems.forEach(function (other) {
        if (other !== item && !other.classList.contains("nav-item-drill")) {
          closeSubmenu(other);
        }
      });

      var trigger = item.querySelector(".nav-submenu-trigger");
      item.classList.add("is-open");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "true");
      }

      if (drillMotionQuery.matches) {
        menu.classList.add("nav-menu--drill");
        return;
      }

      var submenu = item.querySelector(".nav-submenu");
      if (submenu) {
        void submenu.offsetWidth;
      }

      window.requestAnimationFrame(function () {
        menu.classList.add("nav-menu--drill");
      });
    }

    function openDrill(item) {
      if (!menu || !item || drillClosing || !item.classList.contains("nav-item-drill")) return;

      var openDrillItem = getOpenDrillItem();
      if (openDrillItem && openDrillItem !== item) {
        closeDrillAnimated(openDrillItem, function () {
          startDrill(item);
        });
        return;
      }

      startDrill(item);
    }

    submenuItems.forEach(function (item) {
      var trigger = item.querySelector(".nav-submenu-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", function (e) {
        if (mq.matches) {
          e.preventDefault();
          e.stopPropagation();

          if (item.classList.contains("nav-item-drill")) {
            if (menu && menu.classList.contains("nav-menu--drill") && item.classList.contains("is-open")) {
              closeAllSubmenusRef();
            } else {
              openDrill(item);
            }
            syncMegaBackdrop();
            return;
          }

          var open = !item.classList.contains("is-open");
          closeAllSubmenus(open ? item : null);
          item.classList.toggle("is-open", open);
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          syncMegaBackdrop();
        }
      });
    });

    [servicesItem, projectsItem, aboutItem].forEach(function (item) {
      if (!item) return;

      item.addEventListener("mouseenter", syncMegaBackdrop);
      item.addEventListener("mouseleave", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
      item.addEventListener("focusin", syncMegaBackdrop);
      item.addEventListener("focusout", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
    });

    document.addEventListener("click", function (e) {
      if (mq.matches && nav && nav.classList.contains("is-open")) {
        if (menu && (menu.contains(e.target) || (header && header.contains(e.target)))) {
          return;
        }
      }

      submenuItems.forEach(function (item) {
        if (!item.contains(e.target)) {
          closeSubmenu(item);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (nav && nav.classList.contains("is-open") && mq.matches) {
        if (menu && menu.classList.contains("nav-menu--drill")) {
          closeAllSubmenusRef();
          return;
        }
        setMobileNavOpen(false);
        return;
      }
      submenuItems.forEach(closeSubmenu);
      syncMegaBackdrop();
    });

    mq.addEventListener("change", syncMegaBackdrop);
    syncNavDropdowns();
    window.addEventListener("resize", syncNavDropdowns);
  }

  /* Фиксированная шапка: видна на hero, скрывается после полного ухода hero из экрана */
  if (header) {
    var lastScrollY = window.scrollY;
    var ticking = false;
    var deltaThreshold = 8;
    var topAlwaysVisibleBelow = 72;

    function getPageHero() {
      var main = document.getElementById("main");
      if (!main) return null;

      return (
        main.querySelector(".hero-pt") ||
        main.querySelector(".projects-hero-stage") ||
        main.querySelector("[data-subpage-hero]") ||
        main.querySelector(".case-hero")
      );
    }

    function getLayoutShellAnchor() {
      var main = document.getElementById("main");
      if (!main) return null;

      return (
        main.querySelector(".services-showcase__inner") ||
        main.querySelector(".projects-showcase__inner") ||
        main.querySelector(".about-dce__inner") ||
        main.querySelector(".hero-pt__grid") ||
        main.querySelector(".projects-hero__inner--left") ||
        main.querySelector(".projects-hero__inner") ||
        main.querySelector(".subpage-hero__inner")
      );
    }

    function syncHeaderShell() {
      var anchor = getLayoutShellAnchor();
      var root = document.documentElement;

      if (!anchor) {
        root.style.removeProperty("--layout-shell-left");
        root.style.removeProperty("--layout-shell-width");
        return;
      }

      var rect = anchor.getBoundingClientRect();
      root.style.setProperty("--layout-shell-left", Math.round(rect.left) + "px");
      root.style.setProperty("--layout-shell-width", Math.round(rect.width) + "px");
    }

    function setHeaderHeightVar() {
      var h = Math.round(header.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty("--site-header-height", h + "px");
        var gap = Math.max(44, Math.round(window.innerHeight * 0.05));
        document.documentElement.style.setProperty("--hero-header-clearance", h + gap + "px");
      }
      syncHeaderShell();
      if (syncMegaMenuPosition || syncAboutMenuPosition || syncProjectsMenuPosition) {
        syncMegaMenuPosition && syncMegaMenuPosition();
        syncProjectsMenuPosition && syncProjectsMenuPosition();
        syncAboutMenuPosition && syncAboutMenuPosition();
      }
    }

    function isSubnavStuck() {
      var subnav = document.querySelector("[data-section-subnav]");
      var scope = subnav && subnav.closest(".page-sticky-scope");
      if (!subnav || !scope) return false;

      var headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
        ) || 72;

      return scope.getBoundingClientRect().top <= headerHeight + 0.5;
    }

    function syncHeaderOnScroll() {
      ticking = false;
      var y = window.scrollY;
      if (nav && nav.classList.contains("is-open")) {
        header.classList.remove("site-header--hidden");
        lastScrollY = y;
        return;
      }

      if (isSubnavStuck()) {
        header.classList.add("site-header--hidden");
        lastScrollY = y;
        return;
      }

      var hero = getPageHero();
      var dy = y - lastScrollY;

      if (hero) {
        var heroRect = hero.getBoundingClientRect();
        var heroInView = heroRect.bottom > 0 && heroRect.top < window.innerHeight;

        if (heroInView) {
          header.classList.remove("site-header--hidden");
        } else if (heroRect.bottom <= 0) {
          if (dy < 0) {
            header.classList.remove("site-header--hidden");
          } else if (dy > deltaThreshold) {
            header.classList.add("site-header--hidden");
          }
        } else {
          header.classList.remove("site-header--hidden");
        }
      } else if (y <= topAlwaysVisibleBelow) {
        header.classList.remove("site-header--hidden");
      } else if (dy > deltaThreshold) {
        header.classList.add("site-header--hidden");
      } else if (dy < -deltaThreshold) {
        header.classList.remove("site-header--hidden");
      }

      lastScrollY = y;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(syncHeaderOnScroll);
      }
    }

    setHeaderHeightVar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      setHeaderHeightVar();
      syncHeaderOnScroll();
    });
    window.addEventListener("load", setHeaderHeightVar);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setHeaderHeightVar);
    }
    syncHeaderOnScroll();
  }
})();
