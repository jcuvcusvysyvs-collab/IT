(function () {

  var subnav = document.querySelector("[data-section-subnav]");

  if (!subnav || !subnav.querySelector(".page-section-subnav__toggle")) return;



  var toggle = subnav.querySelector(".page-section-subnav__toggle");

  var panel = subnav.querySelector(".page-section-subnav__panel");

  var scope = subnav.closest(".page-sticky-scope");

  var header = document.querySelector(".site-header");

  if (!toggle || !panel || !scope) return;



  function enhanceToggleIcons() {

    var oldClose = toggle.querySelector(".page-section-subnav__toggle-icon--close");

    if (oldClose && !oldClose.querySelector(".page-section-subnav__toggle-x-group")) {

      oldClose.remove();

    }

    if (toggle.querySelector(".page-section-subnav__toggle-icon--close")) return;

    var existingSvg = toggle.querySelector("svg");

    if (existingSvg) {

      existingSvg.classList.add(

        "page-section-subnav__toggle-icon",

        "page-section-subnav__toggle-icon--menu"

      );

      var dots = existingSvg.querySelectorAll("circle");

      for (var i = 0; i < dots.length; i += 1) {

        dots[i].classList.add("page-section-subnav__toggle-dot");

        dots[i].setAttribute("data-dot", String(i + 1));

      }

    }

    var closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    closeIcon.setAttribute("class", "page-section-subnav__toggle-icon page-section-subnav__toggle-icon--close");

    closeIcon.setAttribute("width", "18");

    closeIcon.setAttribute("height", "18");

    closeIcon.setAttribute("viewBox", "0 0 18 18");

    closeIcon.setAttribute("fill", "none");

    closeIcon.setAttribute("aria-hidden", "true");

    var xGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    xGroup.setAttribute("class", "page-section-subnav__toggle-x-group");

    var lineA = document.createElementNS("http://www.w3.org/2000/svg", "path");

    lineA.setAttribute("d", "M5 5l8 8");

    lineA.setAttribute("stroke", "currentColor");

    lineA.setAttribute("stroke-width", "1.6");

    lineA.setAttribute("stroke-linecap", "round");

    var lineB = document.createElementNS("http://www.w3.org/2000/svg", "path");

    lineB.setAttribute("d", "M13 5L5 13");

    lineB.setAttribute("stroke", "currentColor");

    lineB.setAttribute("stroke-width", "1.6");

    lineB.setAttribute("stroke-linecap", "round");

    xGroup.appendChild(lineA);

    xGroup.appendChild(lineB);

    closeIcon.appendChild(xGroup);

    toggle.appendChild(closeIcon);

    var label = toggle.querySelector(".visually-hidden");

    if (!label) {

      label = document.createElement("span");

      label.className = "visually-hidden";

      toggle.insertBefore(label, toggle.firstChild);

    }

    label.textContent = "Меню разделов";

    toggle.setAttribute("aria-label", "Меню разделов");

  }

  enhanceToggleIcons();

  var subnavInner = subnav.querySelector(".page-section-subnav__inner");
  var subnavHomeParent = subnav.parentNode;
  var subnavHomeNext = subnav.nextSibling;
  var backdropHomeParent = null;
  var backdropHomeNext = null;
  var menuMountedToBody = false;

  function placePanelForMobileMenu() {
    if (!subnavInner || !panel) return;
    /* Панель внутри inner — шапка и меню одна карточка */
    if (panel.parentElement !== subnavInner) {
      subnavInner.appendChild(panel);
    }
  }

  function mountMenuToBody() {
    if (menuMountedToBody) return;
    document.body.appendChild(backdrop);
    document.body.appendChild(subnav);
    menuMountedToBody = true;
  }

  function restoreMenuFromBody() {
    restoreMenuReplacingSpacer();
  }

  function syncToggleLabel(open) {

    var label = toggle.querySelector(".visually-hidden");

    var text = open ? "Закрыть меню" : "Меню разделов";

    if (label) label.textContent = text;

    toggle.setAttribute("aria-label", text);

  }



  var mobileQuery = window.matchMedia("(max-width: 900px)");

  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  var backdrop = document.createElement("button");

  backdrop.type = "button";

  backdrop.className = "page-section-subnav__backdrop";

  backdrop.setAttribute("aria-label", "Закрыть меню");

  var backdropAnchor = subnav.nextElementSibling;

  if (backdropAnchor) {

    scope.insertBefore(backdrop, backdropAnchor);

  } else {

    scope.appendChild(backdrop);

  }

  backdropHomeParent = backdrop.parentNode;

  backdropHomeNext = backdrop.nextSibling;



  var spacer = null;

  var lockedScrollY = 0;

  var scrollbarCompensation = 0;

  var isOpen = false;

  var isAnimating = false;

  var stickyTicking = false;

  var menuCloseTimer = null;

  var PANEL_ANIM_MS = 520;

  function getPanelAnimMs() {

    return reducedMotionQuery.matches ? 0 : PANEL_ANIM_MS;

  }



  function headerHeight() {

    return (

      parseFloat(

        getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")

      ) || 72

    );

  }



  function headerOffset() {

    if (header && header.classList.contains("site-header--hidden")) {

      return 0;

    }

    return headerHeight();

  }



  function stickyAnchorY() {

    var scopeTop = scope.getBoundingClientRect().top + window.scrollY;

    return Math.max(0, Math.round(scopeTop - headerHeight()));

  }



  function isSubnavStuck() {

    var top = headerOffset();

    var scopeTop = scope.getBoundingClientRect().top;

    var stickyTop = subnav.getBoundingClientRect().top;

    return scopeTop <= top + 0.5 && stickyTop <= top + 1;

  }



  var lastSubnavHeight = 0;
  var lockedBarHeight = 0;

  function syncSubnavHeight() {
    /* Пока открыта модалка — не пишем высоту листа в --section-subnav-height:
       иначе scroll-margin и вёрстка «прыгают» при закрытии. */
    if (
      isOpen ||
      menuMountedToBody ||
      subnav.classList.contains("page-section-subnav--menu-open") ||
      subnav.classList.contains("page-section-subnav--panel-closing")
    ) {
      if (lockedBarHeight > 0 && lockedBarHeight !== lastSubnavHeight) {
        lastSubnavHeight = lockedBarHeight;
        document.documentElement.style.setProperty("--section-subnav-height", lockedBarHeight + "px");
      }
      return;
    }

    var h = Math.round(subnav.getBoundingClientRect().height);
    if (h <= 0 || h === lastSubnavHeight) return;
    lastSubnavHeight = h;
    lockedBarHeight = h;
    document.documentElement.style.setProperty("--section-subnav-height", h + "px");
  }

  var spyLinks = Array.prototype.slice.call(
    panel.querySelectorAll(".projects-hero-switcher__item[href^='#']")
  ).filter(function (link) {
    var id = link.getAttribute("href").slice(1);
    return id && document.getElementById(id);
  });



  function spyOffset() {

    return headerOffset() + subnav.getBoundingClientRect().height + 24;

  }



  function updateActiveSectionLink() {

    if (!spyLinks.length) return;



    var marker = spyOffset();

    var activeLink = spyLinks[0];



    spyLinks.forEach(function (link) {

      var section = document.getElementById(link.getAttribute("href").slice(1));

      var markerTarget = section ? resolveScrollTarget(section) || section : null;

      if (markerTarget && markerTarget.getBoundingClientRect().top <= marker) {

        activeLink = link;

      }

    });



    spyLinks.forEach(function (link) {

      var isActive = link === activeLink;

      link.classList.toggle("is-active", isActive);

      if (isActive) {

        link.setAttribute("aria-current", "location");

      } else {

        link.removeAttribute("aria-current");

      }

    });

  }



  function syncStickyState() {
    stickyTicking = false;
    if (!isOpen) {
      var stuck = isSubnavStuck();
      var wasStuck = subnav.classList.contains("is-stuck");
      if (wasStuck !== stuck) {
        subnav.classList.toggle("is-stuck", stuck);
        if (window.dcSiteTheme && typeof window.dcSiteTheme.refreshThemeColor === "function") {
          window.dcSiteTheme.refreshThemeColor();
        }
      }
    }
    syncForceHeaderHidden();
    syncSubnavHeight();
    updateActiveSectionLink();
  }



  function onStickyScroll() {

    if (!stickyTicking) {

      stickyTicking = true;

      window.requestAnimationFrame(syncStickyState);

    }

  }



  function hideSiteHeader() {

    if (header) {

      header.classList.add("site-header--hidden");

    }

  }



  function setForceHeaderHidden(on) {

    document.body.classList.toggle("page-section-subnav-force-header-hidden", !!on);

    document.documentElement.classList.toggle("page-section-subnav-force-header-hidden", !!on);

    if (on) hideSiteHeader();

  }



  function syncForceHeaderHidden() {

    /* Пока меню открыто или лента залипла — шапка скрыта, иначе top ленты прыгает с 0 на высоту шапки */
    var stuck = isOpen || isSubnavStuck() || subnav.classList.contains("is-stuck");
    setForceHeaderHidden(stuck);

  }



  function insertSpacer() {

    if (spacer) return;

    var styles = window.getComputedStyle(subnav);

    var height =
      lockedBarHeight ||
      Math.round(subnav.getBoundingClientRect().height) ||
      Math.round(subnav.offsetHeight) ||
      56;

    lockedBarHeight = height;

    spacer = document.createElement("div");

    spacer.className = "page-section-subnav__spacer";

    spacer.setAttribute("aria-hidden", "true");

    spacer.style.height = height + "px";

    /* Лента перекрывает hero отрицательным margin — спейсер должен его сохранить */
    spacer.style.marginTop = styles.marginTop;
    spacer.style.marginBottom = styles.marginBottom;
    spacer.style.overflowAnchor = "none";

    /* Атомарно: лента → спейсер, без кадра «двойной высоты» */
    if (subnav.parentNode) {
      subnav.parentNode.replaceChild(spacer, subnav);
    }

    lastSubnavHeight = height;

    document.documentElement.style.setProperty("--section-subnav-height", height + "px");

  }



  function removeSpacer() {

    if (!spacer) return;

    spacer.remove();

    spacer = null;

  }



  /* Возврат ленты на место спейсера — без двойной высоты и дырки в вёрстке */
  function restoreMenuReplacingSpacer() {

    if (!menuMountedToBody) return;

    if (backdropHomeParent) {

      if (backdropHomeNext && backdropHomeNext.parentNode === backdropHomeParent) {

        backdropHomeParent.insertBefore(backdrop, backdropHomeNext);

      } else {

        backdropHomeParent.appendChild(backdrop);

      }

    }

    if (spacer && spacer.parentNode) {

      spacer.parentNode.replaceChild(subnav, spacer);

      spacer = null;

    } else if (subnavHomeParent) {

      if (subnavHomeNext && subnavHomeNext.parentNode === subnavHomeParent) {

        subnavHomeParent.insertBefore(subnav, subnavHomeNext);

      } else {

        subnavHomeParent.appendChild(subnav);

      }

    }

    menuMountedToBody = false;

  }



  function updateOverlayGeometry() {

    var menuOpen =
      subnav.classList.contains("page-section-subnav--menu-open") ||
      document.body.classList.contains("page-section-subnav-menu-open");

    /* При открытом меню блюр на весь экран; иначе — под полоской */
    var backdropTop = menuOpen ? 0 : Math.round(subnav.getBoundingClientRect().bottom);

    document.documentElement.style.setProperty("--section-subnav-backdrop-top", backdropTop + "px");

    document.documentElement.style.setProperty("--section-subnav-panel-top", backdropTop + "px");

    document.documentElement.style.setProperty("--huawei-subnav-backdrop-top", backdropTop + "px");

    document.documentElement.style.setProperty("--huawei-subnav-panel-top", backdropTop + "px");

    return backdropTop;

  }



  function showBackdrop() {

    updateOverlayGeometry();

    backdrop.classList.add("is-visible");

  }



  function hideBackdrop() {

    if (backdrop.classList.contains("is-visible")) {

      backdrop.classList.add("is-hiding");

      backdrop.classList.remove("is-visible");

      window.setTimeout(function () {

        backdrop.classList.remove("is-hiding");

      }, getPanelAnimMs() || 0);

    }

    document.documentElement.style.removeProperty("--section-subnav-backdrop-top");

    document.documentElement.style.removeProperty("--section-subnav-panel-top");

    document.documentElement.style.removeProperty("--huawei-subnav-backdrop-top");

    document.documentElement.style.removeProperty("--huawei-subnav-panel-top");

  }



  function getScrollbarWidth() {

    return window.innerWidth - document.documentElement.clientWidth;

  }



  function lockPageScroll() {

    lockedScrollY = window.scrollY || window.pageYOffset || 0;

    scrollbarCompensation = getScrollbarWidth();

    document.documentElement.classList.add("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.classList.add("page-section-subnav-menu-open", "page-huawei-subnav-open");

    /* Без position:fixed на body: top:-Y даёт расхождение ~высоты ленты при unlock */
    if (scrollbarCompensation > 0) {

      document.body.style.paddingRight = scrollbarCompensation + "px";

    }

    hideSiteHeader();

  }



  function unlockPageScroll() {

    var restoreY = lockedScrollY;

    var htmlEl = document.documentElement;

    setForceHeaderHidden(true);

    var prevScrollBehavior = htmlEl.style.scrollBehavior;

    htmlEl.style.scrollBehavior = "auto";

    /* Сначала возвращаем scrollbar, потом снимаем компенсацию — иначе контент дёргается */
    document.documentElement.classList.remove("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.classList.remove("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.style.paddingRight = "";

    window.scrollTo(0, restoreY);

    htmlEl.style.scrollBehavior = prevScrollBehavior;

    setForceHeaderHidden(true);

  }



  function preventTouchScroll(event) {

    if (!isOpen) return;

    if (subnav.contains(event.target) || panel.contains(event.target)) return;

    event.preventDefault();

  }



  function setOpen(open, options) {

    var immediate = !!(options && options.immediate);

    var shouldOpen = open && mobileQuery.matches;

    if (shouldOpen === isOpen) return Promise.resolve();



    isOpen = shouldOpen;

    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    syncToggleLabel(shouldOpen);



    if (shouldOpen) {

      if (menuCloseTimer) {

        window.clearTimeout(menuCloseTimer);

        menuCloseTimer = null;

      }

      panel.classList.remove("is-closing");

      subnav.classList.remove("page-section-subnav--panel-closing");

      placePanelForMobileMenu();

      /* Сначала прячем хедер — иначе высота ленты (safe-area) не совпадёт со спейсером */
      setForceHeaderHidden(true);

      void subnav.offsetHeight;

      lockedBarHeight =
        Math.round(subnav.getBoundingClientRect().height) ||
        Math.round(subnav.offsetHeight) ||
        lockedBarHeight ||
        56;

      insertSpacer();

      /* На body fixed всегда относительно окна — полоса не уезжает вверх */
      mountMenuToBody();

      subnav.style.top = "0px";

      subnav.style.left = "0px";

      subnav.style.right = "0px";

      panel.classList.remove("is-open");

      toggle.classList.remove("page-section-subnav__toggle--icons-open");

      subnav.classList.add("is-stuck", "page-section-subnav--menu-open");

      lockPageScroll();



      window.requestAnimationFrame(function () {

        syncSubnavHeight();

        updateOverlayGeometry();

        updateActiveSectionLink();

        /* Кадр со «точками», затем морф в крестик — иначе после mount transition не играет */
        void toggle.offsetWidth;

        window.requestAnimationFrame(function () {

          panel.classList.add("is-open");

          toggle.classList.add("page-section-subnav__toggle--icons-open");

          showBackdrop();

        });

      });

      return Promise.resolve();

    }



    return new Promise(function (resolve) {

      hideBackdrop();

      toggle.classList.remove("page-section-subnav__toggle--icons-open");

      subnav.classList.add("page-section-subnav--panel-closing");

      subnav.style.transition = "none";

      /* Как у фильтра: сначала reflow, потом снятие is-open + is-closing */
      void panel.offsetWidth;

      panel.classList.remove("is-open");

      panel.classList.add("is-closing");

      updateOverlayGeometry();

      subnav.classList.remove("page-section-subnav--menu-open");

      /* При переходе по якорю закрываем сразу — иначе overflow:hidden блокирует scrollTo */
      var animMs = immediate ? 0 : getPanelAnimMs();

      if (menuCloseTimer) window.clearTimeout(menuCloseTimer);

      function finishClose() {

        /*
          Важно: пока body position:fixed, в документе должен оставаться спейсер
          той же высоты, что при lock. Иначе unlock восстанавливает scrollY
          к другой вёрстке → контент прыгает (~высота ленты).
        */
        subnav.style.setProperty("position", "fixed");
        subnav.style.setProperty("top", "0px");
        subnav.style.setProperty("left", "0px");
        subnav.style.setProperty("right", "0px");
        subnav.style.setProperty("z-index", "1300");

        panel.classList.remove("is-closing", "is-open");
        subnav.classList.remove("page-section-subnav--panel-closing", "page-section-subnav--menu-open");
        toggle.classList.remove("page-section-subnav__toggle--icons-open");
        subnav.classList.add("is-stuck");

        void subnav.offsetHeight;

        /* Не меняем высоту спейсера при закрытии — иначе страница дёргается */
        var barH = lockedBarHeight || Math.round(subnav.getBoundingClientRect().height) || 56;
        lastSubnavHeight = barH;
        document.documentElement.style.setProperty("--section-subnav-height", barH + "px");

        if (spacer) {
          spacer.style.height = barH + "px";
        }

        /* Сначала unlock при том же спейсере, что был при открытии */
        unlockPageScroll();

        /* Потом атомарно меняем спейсер на полоску */
        subnav.style.removeProperty("position");
        subnav.style.removeProperty("top");
        subnav.style.removeProperty("left");
        subnav.style.removeProperty("right");
        subnav.style.removeProperty("z-index");
        subnav.style.removeProperty("overflow-anchor");
        subnav.style.transition = "";

        restoreMenuReplacingSpacer();

        setForceHeaderHidden(true);

        window.requestAnimationFrame(function () {
          setForceHeaderHidden(true);
          syncSubnavHeight();
          syncStickyState();
          resolve();
        });

      }

      if (!animMs) {

        finishClose();

        return;

      }

      menuCloseTimer = window.setTimeout(function () {

        menuCloseTimer = null;

        finishClose();

      }, animMs);

    });

  }



  function waitForStickySnap(targetY) {

    if (reducedMotionQuery.matches) {

      return Promise.resolve();

    }



    return new Promise(function (resolve) {

      var done = false;



      function finish() {

        if (done) return;

        done = true;

        window.removeEventListener("scroll", onScroll);

        window.clearTimeout(fallbackTimer);

        resolve();

      }



      function onScroll() {

        if (isSubnavStuck() || Math.abs(window.scrollY - targetY) < 4) {

          finish();

        }

      }



      var fallbackTimer = window.setTimeout(finish, 700);

      window.addEventListener("scroll", onScroll, { passive: true });

    });

  }



  function showSiteHeader() {

    if (header) {

      header.classList.remove("site-header--hidden");

    }

  }



  function resolveScrollTarget(element) {

    if (!element) return null;



    var shellBlock = element.querySelector(":scope > .about-dce__inner > .about-dce__block");

    if (shellBlock) return shellBlock;



    if (element.id === "huawei-clients" || element.classList.contains("huawei-clients")) {

      var clientsInner = element.querySelector(":scope > .huawei-clients__inner");

      if (clientsInner) return clientsInner;

    }



    return element;

  }



  function stickyScrollOffset() {

    syncSubnavHeight();

    return headerOffset() + Math.round(subnav.getBoundingClientRect().height);

  }



  function getElementScrollTop(element) {

    var target = resolveScrollTarget(element) || element;

    return Math.max(

      0,

      Math.round(target.getBoundingClientRect().top + window.scrollY - stickyScrollOffset())

    );

  }



  function waitForScrollEnd(targetY) {

    if (reducedMotionQuery.matches) {

      return Promise.resolve();

    }



    return new Promise(function (resolve) {

      var done = false;



      function finish() {

        if (done) return;

        done = true;

        window.removeEventListener("scroll", onScroll);

        window.clearTimeout(fallbackTimer);

        resolve();

      }



      function onScroll() {

        if (Math.abs(window.scrollY - targetY) <= 2) {

          finish();

        }

      }



      var fallbackTimer = window.setTimeout(finish, 900);

      window.addEventListener("scroll", onScroll, { passive: true });

      onScroll();

    });

  }



  function scrollToElement(element) {

    if (!element) return Promise.resolve();



    // Пока липкое меню уже «залипло», шапку сайта не показываем:
    // повторный клик по якорю почти не скроллит, и header иначе остаётся видимым.
    var wasStuck = isSubnavStuck();
    if (!wasStuck) {
      showSiteHeader();
    }

    var targetY = getElementScrollTop(element);



    window.scrollTo({

      top: targetY,

      behavior: reducedMotionQuery.matches ? "auto" : "smooth",

    });



    return waitForScrollEnd(targetY).then(function () {

      if (wasStuck || isSubnavStuck()) {
        hideSiteHeader();
      }

      syncStickyState();

      updateActiveSectionLink();

    });

  }



  function setLocationHash(id) {

    if (!id) return;

    if (window.history && window.history.replaceState) {

      window.history.replaceState(null, "", "#" + id);

    } else {

      window.location.hash = id;

    }

  }



  function navigatePanelLink(link) {

    var href = link.getAttribute("href");

    if (!href || href.charAt(0) !== "#") return Promise.resolve();



    var id = href.slice(1);

    if (!id) return Promise.resolve();



    var target = document.getElementById(id);

    if (!target) return Promise.resolve();



    var requestType = link.getAttribute("data-huawei-request-type");



    function finishNavigation() {

      return scrollToElement(target).then(function () {

        setLocationHash(id);

        if (requestType && typeof window.dceOpenHuaweiFeedback === "function") {

          window.dceOpenHuaweiFeedback(requestType, { scroll: false });

        }

      });

    }



    if (isOpen) {

      /* Сначала плавно закрываем меню и снимаем overflow:hidden, потом скролл */
      return setOpen(false).then(function () {

        return finishNavigation();

      });

    }



    return finishNavigation();

  }



  function scrollToStickyAnchor() {

    var targetY = stickyAnchorY();



    window.scrollTo({

      top: targetY,

      behavior: reducedMotionQuery.matches ? "auto" : "smooth",

    });



    return waitForStickySnap(targetY).then(function () {

      hideSiteHeader();

      syncStickyState();

    });

  }



  function openMenu() {

    if (isSubnavStuck()) {

      setOpen(true);

      return Promise.resolve();

    }



    isAnimating = true;

    return scrollToStickyAnchor().then(function () {

      window.requestAnimationFrame(function () {

        setOpen(true);

        isAnimating = false;

      });

    });

  }



  toggle.addEventListener("click", function () {

    if (isAnimating) return;



    if (isOpen) {

      setOpen(false);

      return;

    }



    if (!mobileQuery.matches) return;



    openMenu().catch(function () {

      isAnimating = false;

    });

  });



  backdrop.addEventListener("click", function () {

    setOpen(false);

  });



  panel.querySelectorAll("a[href^='#']").forEach(function (link) {

    link.addEventListener("click", function (event) {

      var href = link.getAttribute("href");

      if (!href || href.charAt(0) !== "#") return;



      var id = href.slice(1);

      if (!id || !document.getElementById(id)) return;



      event.preventDefault();

      if (isAnimating) return;



      isAnimating = true;

      navigatePanelLink(link).catch(function () {}).finally(function () {

        isAnimating = false;

      });

    });

  });



  document.addEventListener("keydown", function (event) {

    if (event.key === "Escape" && isOpen) {

      setOpen(false);

    }

  });



  document.addEventListener("touchmove", preventTouchScroll, { passive: false });



  window.addEventListener("scroll", onStickyScroll, { passive: true });

  window.addEventListener("resize", function () {

    if (isOpen) {

      updateOverlayGeometry();

    }

    onStickyScroll();

  });



  function onViewportChange() {

    if (!mobileQuery.matches) {

      setOpen(false);

    }

  }



  if (typeof mobileQuery.addEventListener === "function") {

    mobileQuery.addEventListener("change", onViewportChange);

  } else if (typeof mobileQuery.addListener === "function") {

    mobileQuery.addListener(onViewportChange);

  }



  syncStickyState();

})();

