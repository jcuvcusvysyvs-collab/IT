(function () {
  var subnav = document.querySelector("[data-section-subnav]");
  if (!subnav || !subnav.querySelector(".page-section-subnav__inner--huawei")) return;

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
  document.body.appendChild(backdrop);

  var spacer = null;
  var lockedScrollY = 0;
  var isOpen = false;
  var isAnimating = false;

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

  function syncSubnavHeight() {
    window.dispatchEvent(new Event("resize"));
  }

  function syncStickyState() {
    if (!isOpen) {
      subnav.classList.toggle("is-stuck", isSubnavStuck());
    }
    window.dispatchEvent(new Event("scroll"));
  }

  function hideSiteHeader() {
    if (header) {
      header.classList.add("site-header--hidden");
    }
  }

  function mountOverlay() {
    if (subnav.parentElement === document.body) return;

    spacer = document.createElement("div");
    spacer.className = "page-section-subnav__spacer";
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = subnav.offsetHeight + "px";
    scope.insertBefore(spacer, subnav);
    document.body.appendChild(subnav);
  }

  function unmountOverlay() {
    if (subnav.parentElement !== document.body) return;

    if (spacer) {
      scope.insertBefore(subnav, spacer);
      spacer.remove();
      spacer = null;
    } else {
      scope.insertBefore(subnav, scope.firstChild);
    }
  }

  function updateOverlayGeometry() {
    var subnavBottom = Math.round(subnav.getBoundingClientRect().bottom);
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
    document.documentElement.style.removeProperty("--huawei-subnav-backdrop-top");
    document.documentElement.style.removeProperty("--huawei-subnav-panel-top");
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY;
    document.documentElement.classList.add("page-huawei-subnav-open");
    document.body.classList.add("page-huawei-subnav-open");
    window.scrollTo(0, lockedScrollY);
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("page-huawei-subnav-open");
    document.body.classList.remove("page-huawei-subnav-open");
    window.scrollTo(0, lockedScrollY);
    syncStickyState();
  }

  function preventTouchScroll(event) {
    if (!isOpen) return;
    if (subnav.contains(event.target)) return;
    event.preventDefault();
  }

  function setOpen(open) {
    var shouldOpen = open && mobileQuery.matches;
    if (shouldOpen === isOpen) return;

    isOpen = shouldOpen;
    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    if (shouldOpen) {
      hideSiteHeader();
      mountOverlay();
      subnav.classList.add("page-section-subnav--menu-open");
      lockPageScroll();
      syncSubnavHeight();
      updateOverlayGeometry();
      window.requestAnimationFrame(function () {
        updateOverlayGeometry();
        showBackdrop();
      });
    } else {
      hideBackdrop();
      subnav.classList.remove("page-section-subnav--menu-open");
      unmountOverlay();
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

  panel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen) {
      setOpen(false);
    }
  });

  document.addEventListener("touchmove", preventTouchScroll, { passive: false });

  window.addEventListener("resize", function () {
    if (isOpen) {
      updateOverlayGeometry();
    }
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
})();
