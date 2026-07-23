(() => {
  const root = document.querySelector("[data-asdu-video]");
  if (!root) return;

  const video = root.querySelector(".page-asdu__video");
  const playBtn = root.querySelector("[data-asdu-video-play]");
  if (!video || !playBtn) return;

  const revealPlayer = () => {
    root.classList.add("is-playing");
    playBtn.hidden = true;
    video.setAttribute("controls", "");
  };

  const start = () => {
    revealPlayer();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        /* autoplay blocked — controls remain for manual play */
      });
    }
  };

  playBtn.addEventListener("click", start);

  video.addEventListener("play", revealPlayer);
  video.addEventListener("ended", () => {
    root.classList.remove("is-playing");
    playBtn.hidden = false;
    video.removeAttribute("controls");
    video.currentTime = 0;
  });
})();
