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
      title: "АСДУ ЦОД",
      desc: "Автоматизированные системы диспетчерского управления центра обработки данных на базе SCADA+",
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
  var mobileBackdrop = null;
  var mobileMq = window.matchMedia("(max-width: 768px)");
  var closeAllSubmenusRef = null;

  function isMobileNavViewport() {
    return mobileMq.matches;
  }

  function setMobileNavOpen(open) {
    if (!nav || !toggle) return;

    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-mobile-open", open && isMobileNavViewport());

    if (mobileBackdrop) {
      mobileBackdrop.classList.toggle("is-visible", open && isMobileNavViewport());
    }

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");

    if (header && open) {
      header.classList.remove("site-header--hidden");
    }

    if (!open && closeAllSubmenusRef) {
      closeAllSubmenusRef();
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
    var aboutItem = document.querySelector("#submenu-about")?.closest(".nav-item-has-submenu");
    var aboutSubmenu = document.getElementById("submenu-about");
    var megaBackdrop = null;

    if (aboutItem && aboutSubmenu) {
      aboutItem.classList.add("nav-item-about");
      aboutSubmenu.classList.add("nav-submenu--panel");
    }

    if (servicesItem) {
      servicesItem.classList.add("nav-item-services");
    }

    if (servicesItem || aboutItem) {
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

    syncAboutMenuPosition = function () {
      if (!aboutItem || !aboutSubmenu || mq.matches) {
        if (aboutSubmenu) {
          aboutSubmenu.style.removeProperty("--nav-about-left");
          aboutSubmenu.style.removeProperty("--nav-about-bridge");
        }
        return;
      }

      var trigger = aboutItem.querySelector(".nav-submenu-trigger");
      if (!trigger) return;

      var triggerRect = trigger.getBoundingClientRect();
      var headerHeight = header
        ? header.getBoundingClientRect().height
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")) || 72;
      var submenuWidth = aboutSubmenu.getBoundingClientRect().width || aboutSubmenu.offsetWidth || 208;
      var gutter = 18;
      var gap =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-dropdown-gap")) || 10;
      var submenuTop = headerHeight + gap;
      var bridgeHeight = Math.max(8, submenuTop - triggerRect.bottom + 2);
      var left = triggerRect.right - submenuWidth;
      var maxLeft = window.innerWidth - submenuWidth - gutter;
      left = Math.max(gutter, Math.min(left, maxLeft));

      aboutSubmenu.style.setProperty("--nav-about-left", left + "px");
      aboutSubmenu.style.setProperty("--nav-about-bridge", bridgeHeight + "px");
    };

    function syncNavDropdowns() {
      syncMegaMenuPosition();
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
      var show = isSubmenuActive(servicesItem) || isSubmenuActive(aboutItem);
      document.body.classList.toggle("nav-mega-open", show);
    }

    function closeSubmenu(item) {
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
      closeAllSubmenus(null);
    };

    submenuItems.forEach(function (item) {
      var trigger = item.querySelector(".nav-submenu-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", function (e) {
        if (mq.matches) {
          e.preventDefault();
          var open = !item.classList.contains("is-open");
          closeAllSubmenus(open ? item : null);
          item.classList.toggle("is-open", open);
          trigger.setAttribute("aria-expanded", open ? "true" : "false");
          syncMegaBackdrop();
        }
      });
    });

    if (servicesItem) {
      servicesItem.addEventListener("mouseenter", syncMegaBackdrop);
      servicesItem.addEventListener("mouseleave", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
      servicesItem.addEventListener("focusin", syncMegaBackdrop);
      servicesItem.addEventListener("focusout", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
    }

    if (aboutItem) {
      aboutItem.addEventListener("mouseenter", syncMegaBackdrop);
      aboutItem.addEventListener("mouseleave", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
      aboutItem.addEventListener("focusin", syncMegaBackdrop);
      aboutItem.addEventListener("focusout", function () {
        window.requestAnimationFrame(syncMegaBackdrop);
      });
    }

    document.addEventListener("click", function (e) {
      if (mq.matches && nav && nav.classList.contains("is-open") && header && header.contains(e.target)) {
        return;
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
      if (syncMegaMenuPosition || syncAboutMenuPosition) {
        syncMegaMenuPosition && syncMegaMenuPosition();
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
