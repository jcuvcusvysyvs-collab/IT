(function () {
  var SPEED = 0.32;
  var LOTTIE_SRC = "vendor/lottie.min.js";
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Палитры сайта: light accent #032477, dark accent #3d6fd4, surfaces из styles.css */
  var PALETTES = {
    light: {
      bg: [0.956, 0.961, 0.973, 1], // #f4f6f9
      line: [0.12, 0.2, 0.42, 1], // navy-ish
      circle: [0.012, 0.141, 0.467, 1], // --accent
      shape: [0.2, 0.28, 0.48, 1],
      accent: [0.012, 0.141, 0.467, 1],
    },
    dark: {
      bg: [0.078, 0.102, 0.145, 1], // ~#141a25 — близко к stage
      line: [0.42, 0.58, 0.82, 1], // холодные линии
      circle: [0.55, 0.7, 0.92, 1],
      shape: [0.3, 0.45, 0.72, 1],
      accent: [0.239, 0.435, 0.831, 1], // --accent dark #3d6fd4
    },
  };

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function loadScript(src, attr) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[" + attr + "]");
      if (existing) {
        if (existing.dataset.loaded === "1") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", reject);
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.setAttribute(attr, "1");
      script.onload = function () {
        script.dataset.loaded = "1";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadLottieLib() {
    if (window.lottie) return Promise.resolve(window.lottie);
    return loadScript(LOTTIE_SRC, "data-lottie-lib").then(function () {
      if (!window.lottie) throw new Error("lottie missing");
      return window.lottie;
    });
  }

  function loadAnimationData(mount) {
    if (window.__INFRA_SERVICES_LOTTIE__) {
      return Promise.resolve(window.__INFRA_SERVICES_LOTTIE__);
    }
    var dataSrc =
      mount.getAttribute("data-lottie-data") || "animations/infra-services-lottie-data.js";
    return loadScript(dataSrc, "data-infra-lottie-data").then(function () {
      if (!window.__INFRA_SERVICES_LOTTIE__) throw new Error("lottie data missing");
      return window.__INFRA_SERVICES_LOTTIE__;
    });
  }

  function isPink(c) {
    if (!c || c.length < 3) return false;
    return c[0] > 0.85 && c[1] > 0.4 && c[1] < 0.85 && c[2] > 0.4 && c[2] < 0.85;
  }

  function isBlack(c) {
    if (!c || c.length < 3) return false;
    return c[0] < 0.08 && c[1] < 0.08 && c[2] < 0.08;
  }

  function slotForLayer(name) {
    var n = (name || "").toLowerCase();
    if (n === "bg" || n.indexOf("background") !== -1 || n === "fill") return "bg";
    if (n.indexOf("line") === 0 || n.indexOf("arrow") !== -1) return "line";
    if (n.indexOf("circle") === 0) return "circle";
    if (
      n.indexOf("shape") !== -1 ||
      n.indexOf("poly") !== -1 ||
      n.indexOf("drop") !== -1 ||
      n === "shape"
    ) {
      return "shape";
    }
    if (n.indexOf("matte") !== -1) return null; // маски не перекрашиваем
    return "line";
  }

  function setColorProp(prop, rgba) {
    if (!prop || !prop.k) return;
    if (Array.isArray(prop.k) && typeof prop.k[0] === "number") {
      prop.k = rgba.slice();
    }
  }

  function recolorPaintOps(node, rgba, accent) {
    if (!node || typeof node !== "object") return;
    if (!rgba) return;
    if (Array.isArray(node)) {
      node.forEach(function (item) {
        recolorPaintOps(item, rgba, accent);
      });
      return;
    }

    if (node.ty === "fl" || node.ty === "st") {
      var c = node.c && node.c.k;
      if (isPink(c)) {
        setColorProp(node.c, accent);
      } else if (isBlack(c) || (c && typeof c[0] === "number")) {
        setColorProp(node.c, rgba);
      }
    }

    Object.keys(node).forEach(function (key) {
      if (key === "c") return;
      recolorPaintOps(node[key], rgba, accent);
    });
  }

  function applyThemeColors(source, theme) {
    var data = JSON.parse(JSON.stringify(source));
    var pal = PALETTES[theme] || PALETTES.light;

    data.layers.forEach(function (layer) {
      var name = layer.nm || "";

      if (name === "Color Control" && layer.ef) {
        layer.ef.forEach(function (effect) {
          var en = (effect.nm || "").toLowerCase();
          var colorNode = effect.ef && effect.ef[0] && effect.ef[0].v;
          if (!colorNode) return;
          if (en.indexOf("background") !== -1) setColorProp(colorNode, pal.bg);
          else if (en.indexOf("line") !== -1) setColorProp(colorNode, pal.line);
          else if (en.indexOf("circle") !== -1) setColorProp(colorNode, pal.circle);
          else if (en.indexOf("shape") !== -1) setColorProp(colorNode, pal.shape);
        });
        return;
      }

      var slot = slotForLayer(name);
      if (!slot) return;
      recolorPaintOps(layer, pal[slot] || pal.line, pal.accent);
    });

    return data;
  }

  function initMount(mount) {
    var stage = mount.closest(".infra-scenarios__stage");
    var anim = null;
    var sourceData = null;
    var lottieApi = null;
    var inView = true;
    var theme = currentTheme();

    function syncPlayback() {
      if (!anim) return;
      if (inView && !reduceMotion) {
        anim.play();
      } else {
        anim.pause();
      }
    }

    function destroyAnim() {
      if (!anim) return;
      try {
        anim.destroy();
      } catch (e) {}
      anim = null;
      mount.innerHTML = "";
      mount.classList.remove("is-ready");
    }

    function buildAnim() {
      if (!lottieApi || !sourceData) return;
      destroyAnim();
      theme = currentTheme();

      anim = lottieApi.loadAnimation({
        container: mount,
        renderer: "svg",
        loop: true,
        autoplay: false,
        animationData: applyThemeColors(sourceData, theme),
        rendererSettings: {
          progressiveLoad: true,
          preserveAspectRatio: "xMidYMid slice",
        },
      });
      anim.setSpeed(SPEED);

      anim.addEventListener("DOMLoaded", function () {
        mount.classList.add("is-ready");
        if (reduceMotion) {
          anim.goToAndStop(Math.floor(anim.totalFrames * 0.35), true);
        } else {
          syncPlayback();
        }
      });

      anim.addEventListener("data_failed", function () {
        mount.classList.add("is-failed");
      });
    }

    Promise.all([loadLottieLib(), loadAnimationData(mount)])
      .then(function (parts) {
        lottieApi = parts[0];
        sourceData = parts[1];
        buildAnim();
      })
      .catch(function () {
        mount.classList.add("is-failed");
      });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          inView = !!(entry && entry.isIntersecting);
          syncPlayback();
        },
        { root: null, threshold: 0.05 }
      );
      io.observe(stage || mount.closest(".infra-scenarios__visual") || mount);
    }

    var themeMo = new MutationObserver(function () {
      var next = currentTheme();
      if (next === theme) return;
      buildAnim();
    });
    themeMo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
  }

  function boot() {
    if (isMobile()) return;
    document.querySelectorAll("[data-infra-lottie]").forEach(initMount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
