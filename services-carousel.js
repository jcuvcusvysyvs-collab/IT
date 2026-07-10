(function () {
  var strip = document.querySelector("[data-services-carousel]");
  if (!strip) return;

  var prev = document.querySelector("[data-services-carousel-prev]");
  var next = document.querySelector("[data-services-carousel-next]");
  var progress = document.querySelector("[data-services-carousel-progress]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function slideStep() {
    var slide = strip.querySelector(".services-slide");
    var gap = parseFloat(getComputedStyle(strip).gap) || 16;
    if (slide) return slide.getBoundingClientRect().width + gap;
    return Math.min(strip.clientWidth * 0.88, 380);
  }

  /* Шаг прокрутки = «страница»: целое число слайдов, помещающихся в окно (минимум 1).
     Без этого на широких экранах одна кнопка двигает на один слайд из пяти — приходится кликать 3 раза. */
  function pageStep() {
    var step = slideStep();
    var perPage = Math.max(1, Math.floor(strip.clientWidth / step));
    return perPage * step;
  }

  function scrollByDir(dir) {
    strip.scrollBy({
      left: dir * pageStep(),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  /* Базовое заполнение — чтобы прогресс на старте не выглядел «пустым»; диапазон 0..1 маппится в MIN..1 */
  var PROGRESS_MIN = 0.25;

  function updateState() {
    var max = strip.scrollWidth - strip.clientWidth;
    var ratio = max <= 0 ? 1 : Math.min(1, Math.max(0, strip.scrollLeft / max));
    var visual = PROGRESS_MIN + ratio * (1 - PROGRESS_MIN);
    if (progress) progress.style.setProperty("--services-carousel-scroll", visual.toFixed(4));

    /* Дизейблим стрелки на крайних позициях — без этого пользователь жмёт «вперёд» в пустоту */
    var atStart = strip.scrollLeft <= 1;
    var atEnd = max <= 0 || strip.scrollLeft >= max - 1;
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
  }

  strip.addEventListener("scroll", updateState, { passive: true });
  window.addEventListener("resize", updateState);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(updateState).observe(strip);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateState).catch(updateState);
  } else {
    window.addEventListener("load", updateState);
  }
  updateState();

  if (prev) prev.addEventListener("click", function () { scrollByDir(-1); });
  if (next) next.addEventListener("click", function () { scrollByDir(1); });

  strip.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByDir(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByDir(1);
    }
  });
})();
