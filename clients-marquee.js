(function () {
  var configs = [
    {
      key: "huawei",
      row1Id: "huawei-clients-row-1",
      row2Id: "huawei-clients-row-2",
      marquee: '[data-clients-marquee="huawei"]',
      prefix: "huawei-clients",
      row1: [
        { name: "НЛМК", sub: "Металлургия" },
        { name: "ПЕРЕСВЕТ", sub: "Банк" },
        { name: "МАГНИТ", sub: "Ритейл" },
        { name: "ГАЗПРОМ МЕДИА", sub: "Медиа" },
        { name: "ВБРР", sub: "Банк" },
        { name: "ДИТ МОСКВЫ", sub: "Государство" },
      ],
      row2: [
        { name: "ЦИТО", sub: "Здравоохранение" },
        { name: "САРАТОВСКИЙ НПЗ", sub: "Нефтепереработка" },
        { name: "MASTERTEL", sub: "Телеком" },
        { name: "МСР", sub: "Гос. реестр" },
        { name: "ГАЗПРОМ ИНВЕСТ", sub: "Инвестиции" },
        { name: "МОСКВИЧ", sub: "Автопром" },
      ],
    },
    {
      key: "home",
      row1Id: "home-clients-row-1",
      row2Id: "home-clients-row-2",
      marquee: '[data-clients-marquee="home"]',
      prefix: "clients-showcase",
      row1: [
        { name: "ДИТ МОСКВЫ", sub: "Государство" },
        { name: "ГЛАВГОСЭКСПЕРТИЗА РОССИИ", sub: "Государство" },
        { name: "МИНТРАНС", sub: "Государство" },
        { name: "МГФОМС", sub: "Государство" },
        { name: "МОСВОДОКАНАЛ", sub: "Государство" },
        { name: "ПЕНСИОННЫЙ ФОНД РОССИИ", sub: "Государство" },
        { name: "МОСГОРТРАНС", sub: "Транспорт" },
        { name: "МОСКОЛЛЕКТОР", sub: "ЖКХ" },
        { name: "РОСТЕЛЕКОМ", sub: "Телеком" },
      ],
      row2: [
        { name: "МЕДИАСКОП", sub: "Медиа" },
        { name: "РУДН", sub: "Образование" },
        { name: "ПЕРМСКИЕ МОТОРЫ", sub: "Промышленность" },
        { name: "ИНВИТРО", sub: "Медицина" },
        { name: "ВШЭ", sub: "Образование" },
        { name: "НПФ СБЕРБАНКА", sub: "Финансы" },
        { name: "СИБУР", sub: "Промышленность" },
        { name: "ГУП ВЦКП", sub: "ЖКХ" },
      ],
    },
  ];

  var el = "div";
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var repeat = reduceMotion ? 1 : 4;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildRow(items, prefix) {
    return items
      .map(function (client) {
        return (
          "<" + el + ' class="' + prefix + '__logo">' +
          "<" + el + ' class="' + prefix + '__logo-inner">' +
          '<span class="' + prefix + '__logo-name">' +
          escapeHtml(client.name) +
          "</span>" +
          '<span class="' + prefix + '__logo-sub">' +
          escapeHtml(client.sub) +
          "</span>" +
          "</" + el + ">" +
          "</" + el + ">" +
          "<" + el + ' class="' + prefix + '__logo-divider" aria-hidden="true"><span></span></' + el + ">"
        );
      })
      .join("");
  }

  configs.forEach(function (config) {
    var track1 = document.getElementById(config.row1Id);
    var track2 = document.getElementById(config.row2Id);
    if (!track1 || !track2) return;

    var chunk1 = buildRow(config.row1, config.prefix);
    var chunk2 = buildRow(config.row2, config.prefix);
    var html1 = "";
    var html2 = "";
    var i;

    for (i = 0; i < repeat; i += 1) {
      html1 += chunk1;
      html2 += chunk2;
    }

    track1.innerHTML = html1;
    track2.innerHTML = html2;

    var marquee = document.querySelector(config.marquee);
    if (!marquee) return;

    var names = config.row1.concat(config.row2).map(function (client) {
      return client.name;
    });
    marquee.setAttribute("aria-label", "Заказчики: " + names.join(", "));
  });
})();
