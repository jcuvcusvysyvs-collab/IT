/**
 * Расстановка пинов карты на главной.
 *
 * Как пользоваться:
 * 1. Откройте index.html в браузере, прокрутите к блоку карты.
 * 2. DevTools → Console → вставьте этот файл целиком → Enter.
 * 3. Кликайте по карте: города идут по очереди.
 * 4. Можно перетащить уже поставленную точку.
 * 5. Горячие клавиши:
 *    Z / Backspace — отменить последнюю точку
 *    S             — пропустить город
 *    E             — вывести готовый CITY_PINS в консоль (+ копирование)
 *    Esc           — выключить режим расстановки
 *
 * Команды в консоли:
 *   geoPin.export()  — JSON для вставки в home-geo-data.js → pins[]
 *   geoPin.undo()
 *   geoPin.skip()
 *   geoPin.stop()
 */
(function () {
  var stage = document.querySelector(".home-geo__map-stage");
  var host = document.querySelector("[data-geo-pins]");
  if (!stage || !host) {
    console.error("Карта .home-geo__map-stage / [data-geo-pins] не найдена. Откройте главную.");
    return;
  }

  if (window.geoPin && typeof window.geoPin.stop === "function") {
    window.geoPin.stop();
  }

  var queue = [
    { city: "Москва", groups: [1, 2] },
    { city: "Санкт-Петербург", groups: [1, 2] },
    { city: "Альметьевск", groups: [1] },
    { city: "Жигулевск", groups: [1] },
    { city: "Иркутск", groups: [1, 2] },
    { city: "Истра", groups: [1] },
    { city: "Казань", groups: [1] },
    { city: "Красногорск", groups: [1] },
    { city: "Краснодар", groups: [1] },
    { city: "Красноярск", groups: [1, 2] },
    { city: "Липецк", groups: [1] },
    { city: "Нижний Новгород", groups: [1, 2] },
    { city: "Пермь", groups: [1] },
    { city: "Саратов", groups: [1] },
    { city: "Ставрополь", groups: [1] },
    { city: "Тюмень", groups: [1] },
    { city: "Челябинск", groups: [1] },
    { city: "Анапа", groups: [2] },
    { city: "Астрахань", groups: [2] },
    { city: "Балаково", groups: [2] },
    { city: "Белгород", groups: [2] },
    { city: "Владимир", groups: [2] },
    { city: "Волгодонск", groups: [2] },
    { city: "Воронеж", groups: [2] },
    { city: "Всеволожск", groups: [2] },
    { city: "Десногорск", groups: [2] },
    { city: "Екатеринбург", groups: [2] },
    { city: "Зеленоградск", groups: [2] },
    { city: "Калининград", groups: [2] },
    { city: "Калуга", groups: [2] },
    { city: "Курчатов", groups: [2] },
    { city: "Кызыл", groups: [2] },
    { city: "Магнитогорск", groups: [2] },
    { city: "Мончегорск", groups: [2] },
    { city: "Мурманск", groups: [2] },
    { city: "Нововоронеж", groups: [2] },
    { city: "Омск", groups: [2] },
    { city: "Орёл", groups: [2] }
  ];

  var placed = [];
  var index = 0;
  var drag = null;

  host.innerHTML = "";

  var hud = document.createElement("div");
  hud.id = "geo-pin-hud";
  hud.style.cssText =
    "position:fixed;z-index:99999;left:16px;bottom:16px;max-width:min(420px,92vw);" +
    "padding:12px 14px;border-radius:10px;background:#0a0e14;color:#fff;" +
    "font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);";
  document.body.appendChild(hud);

  function fmt(n) {
    return Math.round(n * 10) / 10;
  }

  function updateHud() {
    var cur = queue[index];
    var left = queue.length - index;
    hud.innerHTML =
      "<b>Расстановка пинов</b><br>" +
      (cur
        ? "Сейчас: <b style=\"color:#7eb6ff\">" +
          cur.city +
          "</b> · группа " +
          cur.groups.join("+") +
          "<br>Осталось: " +
          left
        : "<b style=\"color:#8dce8d\">Готово</b> — нажмите E или geoPin.export()") +
      "<br><span style=\"opacity:.7\">клик = поставить · drag = подвинуть · Z отмена · S пропуск · E экспорт · Esc стоп</span>";
  }

  function pctFromEvent(e) {
    var box = stage.getBoundingClientRect();
    var x = ((e.clientX - box.left) / box.width) * 100;
    var y = ((e.clientY - box.top) / box.height) * 100;
    return {
      x: Math.min(100, Math.max(0, fmt(x))),
      y: Math.min(100, Math.max(0, fmt(y)))
    };
  }

  function renderPin(entry) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "home-geo__pin home-geo__pin--sm";
    el.style.left = entry.x + "%";
    el.style.top = entry.y + "%";
    el.setAttribute("data-city", entry.city);
    el.innerHTML =
      '<span class="home-geo__pin-dot" aria-hidden="true"></span>' +
      '<span class="home-geo__pin-label">' +
      entry.city +
      " · " +
      entry.x +
      "% / " +
      entry.y +
      "%</span>";
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      drag = { el: el, entry: entry };
      el.setPointerCapture(e.pointerId);
    });
    host.appendChild(el);
    return el;
  }

  function placeAt(e) {
    var cur = queue[index];
    if (!cur) return;
    var p = pctFromEvent(e);
    var entry = {
      city: cur.city,
      x: p.x,
      y: p.y,
      groups: cur.groups.slice()
    };
    placed.push(entry);
    renderPin(entry);
    console.log(
      "[" + (index + 1) + "/" + queue.length + "]",
      entry.city,
      "→",
      entry.x + "%",
      entry.y + "%"
    );
    index += 1;
    updateHud();
    if (index >= queue.length) exportCode(true);
  }

  function onStageClick(e) {
    if (drag) return;
    if (e.target.closest(".home-geo__pin")) return;
    placeAt(e);
  }

  function onPointerMove(e) {
    if (!drag) return;
    var p = pctFromEvent(e);
    drag.entry.x = p.x;
    drag.entry.y = p.y;
    drag.el.style.left = p.x + "%";
    drag.el.style.top = p.y + "%";
    var label = drag.el.querySelector(".home-geo__pin-label");
    if (label) label.textContent = drag.entry.city + " · " + p.x + "% / " + p.y + "%";
  }

  function onPointerUp() {
    if (!drag) return;
    console.log("moved", drag.entry.city, "→", drag.entry.x + "%", drag.entry.y + "%");
    drag = null;
  }

  function undo() {
    if (!placed.length) return;
    var last = placed.pop();
    var el = host.querySelector('.home-geo__pin[data-city="' + CSS.escape(last.city) + '"]');
    if (el) el.remove();
    index = Math.max(0, index - 1);
    console.log("undo", last.city);
    updateHud();
  }

  function skip() {
    var cur = queue[index];
    if (!cur) return;
    console.log("skip", cur.city);
    index += 1;
    updateHud();
  }

  function exportCode(auto) {
    var pins = placed.map(function (p) {
      return { city: p.city, x: p.x, y: p.y, groups: p.groups.slice() };
    });
    var code = JSON.stringify(pins, null, 2);
    console.log("Вставьте в home-geo-data.js → HOME_GEO_DATA.pins:\n" + code);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(
        function () {
          console.log(
            auto
              ? "Готово — pins[] скопирован в буфер (JSON)."
              : "pins[] скопирован в буфер (JSON)."
          );
        },
        function () {}
      );
    }
    return code;
  }

  function onKey(e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "z" || e.key === "Z" || e.key === "Backspace") {
      e.preventDefault();
      undo();
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      skip();
    } else if (e.key === "e" || e.key === "E") {
      e.preventDefault();
      exportCode(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      stop();
    }
  }

  function stop() {
    stage.removeEventListener("click", onStageClick, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("keydown", onKey, true);
    if (hud.parentNode) hud.parentNode.removeChild(hud);
    stage.style.cursor = "";
    console.log("geoPin остановлен. Экспорт: geoPin.export()");
  }

  stage.style.cursor = "crosshair";
  stage.addEventListener("click", onStageClick, true);
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("keydown", onKey, true);

  window.geoPin = {
    export: exportCode,
    undo: undo,
    skip: skip,
    stop: stop,
    placed: placed
  };

  updateHud();
  console.log("geoPin: кликайте по карте. Экспорт — E или geoPin.export()");
})();
