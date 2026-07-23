(function () {

  var subnav = document.querySelector("[data-section-subnav]");

  if (!subnav || !subnav.querySelector(".page-section-subnav__toggle")) return;



  var toggle = subnav.querySelector(".page-section-subnav__toggle");

  var panel = subnav.querySelector(".page-section-subnav__panel");

  var scope = subnav.closest(".page-sticky-scope");

  var header = document.querySelector(".site-header");

  if (!toggle || !panel || !scope) return;



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



  var spacer = null;

  var lockedScrollY = 0;

  var scrollbarCompensation = 0;

  var isOpen = false;

  var isAnimating = false;

  var stickyTicking = false;



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

  function syncSubnavHeight() {
    var h = Math.round(subnav.getBoundingClientRect().height);
    if (h <= 0 || h === lastSubnavHeight) return;
    lastSubnavHeight = h;
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
      if (subnav.classList.contains("is-stuck") !== stuck) {
        subnav.classList.toggle("is-stuck", stuck);
      }
    }
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



  function insertSpacer() {

    if (spacer) return;



    var height = Math.round(subnav.getBoundingClientRect().height);

    spacer = document.createElement("div");

    spacer.className = "page-section-subnav__spacer";

    spacer.setAttribute("aria-hidden", "true");

    spacer.style.height = height + "px";

    subnav.parentNode.insertBefore(spacer, subnav);

  }



  function removeSpacer() {

    if (!spacer) return;

    spacer.remove();

    spacer = null;

  }



  function updateOverlayGeometry() {

    var subnavBottom = Math.round(subnav.getBoundingClientRect().bottom);

    document.documentElement.style.setProperty("--section-subnav-backdrop-top", subnavBottom + "px");

    document.documentElement.style.setProperty("--section-subnav-panel-top", subnavBottom + 8 + "px");

    document.documentElement.style.setProperty("--huawei-subnav-backdrop-top", subnavBottom + "px");

    document.documentElement.style.setProperty("--huawei-subnav-panel-top", subnavBottom + 8 + "px");

    return subnavBottom;

  }



  function showBackdrop() {

    if (updateOverlayGeometry() > 0) {

      backdrop.classList.add("is-visible");

    }

  }



  function hideBackdrop() {

    backdrop.classList.remove("is-visible");

    document.documentElement.style.removeProperty("--section-subnav-backdrop-top");

    document.documentElement.style.removeProperty("--section-subnav-panel-top");

    document.documentElement.style.removeProperty("--huawei-subnav-backdrop-top");

    document.documentElement.style.removeProperty("--huawei-subnav-panel-top");

  }



  function getScrollbarWidth() {

    return window.innerWidth - document.documentElement.clientWidth;

  }



  function lockPageScroll() {

    lockedScrollY = window.scrollY;

    scrollbarCompensation = getScrollbarWidth();

    document.documentElement.classList.add("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.classList.add("page-section-subnav-menu-open", "page-huawei-subnav-open");



    if (scrollbarCompensation > 0) {

      document.body.style.paddingRight = scrollbarCompensation + "px";

    }



    window.scrollTo(0, lockedScrollY);

  }



  function unlockPageScroll() {

    document.documentElement.classList.remove("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.classList.remove("page-section-subnav-menu-open", "page-huawei-subnav-open");

    document.body.style.paddingRight = "";

    window.scrollTo(0, lockedScrollY);

    syncStickyState();

  }



  function preventTouchScroll(event) {

    if (!isOpen) return;

    if (subnav.contains(event.target) || panel.contains(event.target)) return;

    event.preventDefault();

  }



  function setOpen(open) {

    var shouldOpen = open && mobileQuery.matches;

    if (shouldOpen === isOpen) return;



    isOpen = shouldOpen;

    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");



    if (shouldOpen) {

      var pinTop = Math.round(subnav.getBoundingClientRect().top);



      insertSpacer();

      hideSiteHeader();

      subnav.style.top = pinTop + "px";

      subnav.classList.add("page-section-subnav--menu-open");

      lockPageScroll();



      window.requestAnimationFrame(function () {

        subnav.style.top = "0px";

        syncSubnavHeight();

        updateOverlayGeometry();

        updateActiveSectionLink();

        window.requestAnimationFrame(showBackdrop);

      });

    } else {

      hideBackdrop();

      subnav.classList.remove("page-section-subnav--menu-open");

      subnav.style.top = "";

      removeSpacer();

      unlockPageScroll();

      syncSubnavHeight();

    }

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

      setOpen(false);

      return new Promise(function (resolve) {

        window.requestAnimationFrame(function () {

          window.requestAnimationFrame(function () {

            finishNavigation().then(resolve);

          });

        });

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

