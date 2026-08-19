(function () {
  "use strict";

  var video = document.querySelector(".infra-form-layout__video");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var desktopMq = window.matchMedia("(min-width: 768px)");

  function pickSrc() {
    return desktopMq.matches
      ? "video/data-center-hero.mp4"
      : "video/data-center-hero-mobile.mp4?v=20260818-m720p";
  }

  function showAndPlay() {
    video.classList.add("is-ready");
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        /* autoplay blocked — poster stays visible */
      });
    }
  }

  function attachLoopGuard() {
    if (video.getAttribute("data-loop-guard") === "1") return;
    video.setAttribute("data-loop-guard", "1");
    video.addEventListener("ended", function () {
      video.currentTime = 0;
      video.play().catch(function () {});
    });
  }

  function loadVideo() {
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = true;
    video.src = pickSrc();
    try {
      video.load();
    } catch (e) {
      /* noop */
    }
  }

  video.addEventListener("canplay", showAndPlay, { once: true });
  attachLoopGuard();
  loadVideo();

  if (typeof desktopMq.addEventListener === "function") {
    desktopMq.addEventListener("change", function () {
      loadVideo();
    });
  } else if (typeof desktopMq.addListener === "function") {
    desktopMq.addListener(function () {
      loadVideo();
    });
  }
})();
