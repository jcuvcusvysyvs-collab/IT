(function () {
  "use strict";

  var CELL = 52;
  var LINE_WIDTH = 2.75;
  var RADIUS = 280;
  var OFFSCREEN = -1000;

  function gridLineWidth() {
    return LINE_WIDTH * 0.82;
  }

  function parseRgbTriplet(value) {
    if (!value) return null;
    var parts = value.split(",").map(function (part) {
      return parseFloat(part.trim());
    });
    if (parts.length < 3 || parts.some(function (n) { return Number.isNaN(n); })) return null;
    return { r: parts[0], g: parts[1], b: parts[2] };
  }

  function readAccent(stage, prefix, fallback) {
    var cs = getComputedStyle(stage);
    var rgb = parseRgbTriplet(cs.getPropertyValue(prefix));
    var alpha = parseFloat(cs.getPropertyValue(prefix + "-a"));
    if (!rgb) return fallback;
    return {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: Number.isNaN(alpha) ? fallback.a : alpha,
    };
  }

  function themeColors(stage) {
    return {
      base: { r: 72, g: 76, b: 84, a: 0.28 },
      lit: readAccent(stage, "--hero-grid-lit", { r: 96, g: 142, b: 188, a: 0.46 }),
      glow: readAccent(stage, "--hero-grid-glow", { r: 82, g: 148, b: 198, a: 0.52 }),
    };
  }

  function drawGrid(ctx, w, h, color) {
    if (color.a <= 0.003) return;
    var line = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    ctx.lineWidth = gridLineWidth();
    ctx.lineCap = "square";
    for (var x = 0; x <= w; x += CELL) {
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (var y = 0; y <= h; y += CELL) {
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  }

  function applySoftSpotMask(ctx, w, h, px, py) {
    ctx.globalCompositeOperation = "destination-in";
    var inner = RADIUS * 0.04;
    var outer = RADIUS * 1.08;
    var mask = ctx.createRadialGradient(px, py, inner, px, py, outer);
    mask.addColorStop(0, "rgba(255,255,255,1)");
    mask.addColorStop(0.28, "rgba(255,255,255,0.92)");
    mask.addColorStop(0.48, "rgba(255,255,255,0.68)");
    mask.addColorStop(0.64, "rgba(255,255,255,0.38)");
    mask.addColorStop(0.78, "rgba(255,255,255,0.16)");
    mask.addColorStop(0.9, "rgba(255,255,255,0.05)");
    mask.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function applyEdgeVignette(ctx, w, h) {
    var cx = w * 0.5;
    var cy = h * 0.42;
    var maxDim = Math.max(w, h);

    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.translate(cx, cy);
    ctx.scale(w / maxDim, (h / maxDim) * 0.9);

    var inner = maxDim * 0.24;
    var outer = maxDim * 0.66;
    var g = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.48, "rgba(255,255,255,0.96)");
    g.addColorStop(0.64, "rgba(255,255,255,0.82)");
    g.addColorStop(0.76, "rgba(255,255,255,0.58)");
    g.addColorStop(0.86, "rgba(255,255,255,0.32)");
    g.addColorStop(0.94, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-maxDim, -maxDim, maxDim * 2, maxDim * 2);
    ctx.restore();
  }

  function applyBottomFade(ctx, w, h, fadeH) {
    var fade = Math.min(Math.max(fadeH * 1.2, h * 0.3), h * 0.62);
    var start = h - fade;
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    var g = ctx.createLinearGradient(0, start, 0, h);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.06, "rgba(255,255,255,0.9)");
    g.addColorStop(0.18, "rgba(255,255,255,0.58)");
    g.addColorStop(0.32, "rgba(255,255,255,0.28)");
    g.addColorStop(0.46, "rgba(255,255,255,0.1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.03)");
    g.addColorStop(0.76, "rgba(255,255,255,0.008)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function fadeHeight(stage, h) {
    var cs = getComputedStyle(stage);
    var custom =
      parseFloat(cs.getPropertyValue("--hero-fade-height")) ||
      parseFloat(cs.getPropertyValue("--projects-hero-fade-height"));
    if (custom > 0) return custom;
    var pad = parseFloat(cs.paddingBottom);
    if (pad > 0) return pad;
    return h * 0.3;
  }

  function drawGlow(ctx, w, h, px, py, rgb) {
    var strength = rgb.a != null ? rgb.a : 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var g = ctx.createRadialGradient(px, py, RADIUS * 0.02, px, py, RADIUS * 1.55);
    g.addColorStop(0, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (0.28 * strength) + ")");
    g.addColorStop(0.22, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (0.16 * strength) + ")");
    g.addColorStop(0.42, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (0.08 * strength) + ")");
    g.addColorStop(0.62, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (0.035 * strength) + ")");
    g.addColorStop(0.82, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + (0.014 * strength) + ")");
    g.addColorStop(1, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function initHero(stage) {
    initHeroScroll(stage);

    var wrap = stage.querySelector(".projects-hero__grid");
    if (!wrap || wrap.dataset.gridReady) return;
    wrap.dataset.gridReady = "1";

    wrap.innerHTML = "";

    var canvas = document.createElement("canvas");
    canvas.className = "projects-hero__grid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    wrap.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var lit = document.createElement("canvas");
    var ltx = lit.getContext("2d");
    if (!ctx || !ltx) return;

    var px = OFFSCREEN;
    var py = OFFSCREEN;
    var visible = false;
    var frozen = false;
    var w = 0;
    var h = 0;
    var switcher = document.querySelector("[data-section-subnav] .projects-hero-switcher");
    var freezeTargets = stage.querySelectorAll(
      ".subpage-hero__actions, .projects-hero-actions"
    );

    function render() {
      var rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (w <= 0 || h <= 0) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cw = Math.round(w * dpr);
      var ch = Math.round(h * dpr);
      var fadeH = fadeHeight(stage, h);

      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      lit.width = cw;
      lit.height = ch;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ltx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);

      var colors = themeColors(stage);
      drawGrid(ctx, w, h, colors.base);

      if (visible) {
        ltx.clearRect(0, 0, w, h);
        drawGrid(ltx, w, h, colors.lit);
        applySoftSpotMask(ltx, w, h, px, py);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(lit, 0, 0, w, h);
        ctx.restore();

        drawGlow(ctx, w, h, px, py, colors.glow);
      }

      applyEdgeVignette(ctx, w, h);
      applyBottomFade(ctx, w, h, fadeH);
    }

    function move(clientX, clientY) {
      if (frozen) return;
      var rect = wrap.getBoundingClientRect();
      px = clientX - rect.left;
      py = clientY - rect.top;
      visible = true;
      render();
    }

    function bindFreeze(el) {
      if (!el) return;
      el.addEventListener("pointerenter", function () {
        frozen = true;
        if (visible) render();
      });
      el.addEventListener("pointerleave", function () {
        frozen = false;
      });
    }

    bindFreeze(switcher);
    freezeTargets.forEach(bindFreeze);

    stage.addEventListener(
      "pointermove",
      function (e) {
        move(e.clientX, e.clientY);
      },
      { passive: true }
    );

    window.addEventListener("resize", render);

    render();
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function initHeroScroll(stage) {
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    stage.style.setProperty("--hero-fade", "0");
    stage.style.setProperty("--hero-shift", "0");
    stage.style.setProperty("--projects-hero-fade", "0");
    stage.style.setProperty("--projects-hero-shift", "0");

    if (reduceMotion) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = stage.getBoundingClientRect();
      var range = Math.max(rect.height * 0.82, 1);
      var headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
        ) || 88;
      var adjustedTop = rect.top + headerHeight;
      var raw = Math.min(Math.max(-adjustedTop / range, 0), 1);
      var fade = easeOutCubic(raw);
      var shift = easeOutCubic(Math.min(Math.max((raw - 0.12) / 0.88, 0), 1));

      stage.style.setProperty("--hero-fade", fade.toFixed(4));
      stage.style.setProperty("--hero-shift", shift.toFixed(4));
      stage.style.setProperty("--projects-hero-fade", fade.toFixed(4));
      stage.style.setProperty("--projects-hero-shift", shift.toFixed(4));
      stage.classList.toggle("is-scrolling", raw > 0.02);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function initStickySubnav() {
    var sticky = document.querySelector("[data-section-subnav]");
    if (!sticky) return;

    var scope = sticky.closest(".page-sticky-scope");
    if (!scope) return;

    var header = document.querySelector(".site-header");
    var ticking = false;

    function headerOffset() {
      if (header && header.classList.contains("site-header--hidden")) {
        return 0;
      }

      return (
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
        ) || 72
      );
    }

    function syncSubnavHeight() {
      var h = sticky.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty("--section-subnav-height", h + "px");
      }
    }

    function updateStickyState() {
      ticking = false;
      var top = headerOffset();
      var scopeTop = scope.getBoundingClientRect().top;
      var stickyTop = sticky.getBoundingClientRect().top;
      var isStuck = scopeTop <= top + 0.5 && stickyTop <= top + 1;
      sticky.classList.toggle("is-stuck", isStuck);
      syncSubnavHeight();
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateStickyState);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateStickyState();
  }

  function init() {
    document.querySelectorAll("[data-hero-grid]").forEach(initHero);
    initStickySubnav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
