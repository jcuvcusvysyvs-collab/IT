(function () {
  var SPEED = 0.72;
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadLottieLib() {
    if (window.lottie) return Promise.resolve(window.lottie);

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-lottie-lib]');
      if (existing) {
        existing.addEventListener("load", function () {
          resolve(window.lottie);
        });
        existing.addEventListener("error", reject);
        return;
      }

      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
      script.async = true;
      script.dataset.lottieLib = "1";
      script.onload = function () {
        if (window.lottie) resolve(window.lottie);
        else reject(new Error("lottie missing"));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initMount(mount) {
    var src = mount.getAttribute("data-lottie-src") || "animations/data.json";
    var panel = mount.closest(".infra-scenarios__panel");
    var anim = null;
    var loaded = false;
    var wantPlay = false;

    function syncPlayback() {
      if (!anim) return;
      var panelActive = !panel || panel.classList.contains("is-active");
      if (panelActive && wantPlay && !reduceMotion) {
        anim.play();
      } else {
        anim.pause();
      }
    }

    function ensureAnim(lottie) {
      if (loaded) return;
      loaded = true;
      anim = lottie.loadAnimation({
        container: mount,
        renderer: "svg",
        loop: true,
        autoplay: false,
        path: src,
        rendererSettings: {
          progressiveLoad: true,
          preserveAspectRatio: "xMidYMid slice",
        },
      });
      anim.setSpeed(SPEED);
      anim.addEventListener("DOMLoaded", syncPlayback);
      syncPlayback();
    }

    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          wantPlay = !!(entry && entry.isIntersecting);
          if (wantPlay && !loaded) {
            loadLottieLib()
              .then(ensureAnim)
              .catch(function () {});
          } else {
            syncPlayback();
          }
        },
        { root: null, threshold: 0.12 }
      );
      io.observe(mount);
    } else {
      wantPlay = true;
      loadLottieLib()
        .then(ensureAnim)
        .catch(function () {});
    }

    if (panel) {
      var mo = new MutationObserver(syncPlayback);
      mo.observe(panel, { attributes: true, attributeFilter: ["class"] });
    }

    if (reduceMotion) {
      wantPlay = false;
      loadLottieLib()
        .then(function (lottie) {
          ensureAnim(lottie);
          if (anim) {
            anim.goToAndStop(0, true);
          }
        })
        .catch(function () {});
    }
  }

  function boot() {
    document.querySelectorAll("[data-infra-lottie]").forEach(initMount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
