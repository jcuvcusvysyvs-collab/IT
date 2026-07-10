(function () {
  var serviceMenuIcons = {
    "infrastructure-solutions.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="4" y="3" width="16" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>' +
      '<rect x="4" y="14" width="16" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="7.5" cy="6.5" r="1" fill="currentColor"/>' +
      '<circle cx="7.5" cy="17.5" r="1" fill="currentColor"/>' +
      '<path d="M11 6.5h7M11 17.5h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
      "</svg>",
    "information-security.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 3L5 6.2v5.5c0 4.5 2.9 8.7 7 9.8 4.1-1.1 7-5.3 7-9.8V6.2L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>",
    "scaling-without-procurement.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M7 10H5M7 14H5M19 10h-2M19 14h-2M10 7V5M14 7V5M10 19v-2M14 19v-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      "</svg>",
    "business-continuity.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M17 10a5 5 0 00-8.5-3.6L7 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M7 8v3h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M7 14a5 5 0 008.5 3.6L17 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M17 16v-3h-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>",
    "operations-support.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      "</svg>",
  };

  var aboutMenuIcons = {
    "about.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M4 20V8l8-4 8 4v12" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M9 20v-6h6v6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M4 12h16" stroke="currentColor" stroke-width="1.6"/>' +
      "</svg>",
    "about.html#certificates":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M7 4h10v16H7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M11 2v2M13 2v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      "</svg>",
    "contacts.html":
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M3 8l9 6 9-6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      "</svg>",
  };

  function injectSubmenuIcons(selector, iconMap, skipClass) {
    document.querySelectorAll(selector).forEach(function (link) {
      if (skipClass && link.classList.contains(skipClass)) {
        return;
      }
      if (link.querySelector(".nav-submenu-links__icon")) {
        return;
      }

      var href = link.getAttribute("href") || "";
      var file = href.split("/").pop().split("?")[0];
      var hash = href.indexOf("#") !== -1 ? "#" + href.split("#")[1] : "";
      var svg = iconMap[file] || iconMap[href] || iconMap[hash];
      if (!svg) return;

      var label = link.textContent.trim();
      link.textContent = "";

      var icon = document.createElement("span");
      icon.className = "nav-submenu-links__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = svg;

      var text = document.createElement("span");
      text.className = "nav-submenu-links__label";
      text.textContent = label;

      link.appendChild(icon);
      link.appendChild(text);
    });
  }

  injectSubmenuIcons(".nav-submenu-links a[href]", serviceMenuIcons, "nav-submenu-feature");
  injectSubmenuIcons("#submenu-about a[href]", aboutMenuIcons);

  function injectHeaderCta() {
    var actions = document.querySelector(".header-actions");
    if (!actions || actions.querySelector(".header-cta")) {
      return;
    }

    var cta = document.createElement("a");
    cta.className = "header-cta";
    cta.href = "contacts.html";
    cta.textContent = "Контакты";
    actions.appendChild(cta);
  }

  injectHeaderCta();

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  var submenuItems = document.querySelectorAll(".nav-item-has-submenu");
  var header = document.querySelector(".site-header");
  var syncMegaMenuPosition = null;
  var syncAboutMenuPosition = null;

  if (toggle && menu && nav) {
    toggle.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      if (header && open) {
        header.classList.remove("site-header--hidden");
      }
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Открыть меню");
      });
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
      var megaWidth = mega.getBoundingClientRect().width || mega.offsetWidth || 552;
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
      submenuItems.forEach(function (item) {
        if (!item.contains(e.target)) {
          closeSubmenu(item);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        submenuItems.forEach(closeSubmenu);
        syncMegaBackdrop();
      }
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
