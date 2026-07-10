/* Трансформация строк списка проектов в полноценные карточки */
(function () {
  'use strict';

  var ARROW = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
            + '<path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.2"'
            + ' stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Простой хэш для стабильного назначения цветового акцента */
  function hashStr(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return Math.abs(h);
  }

  /* Аббревиатура из значимых слов (пропускаем организационно-правовые формы) */
  var ORG_FORMS = /^(ООО|АО|ОАО|ПАО|ЗАО|ФКУ|ФГУП|ГБУ|ФАУ|ФГБУ|ГУП|ОДК|ДИТ)$/i;
  function initials(name) {
    var clean = name.replace(/[«»""']/g, '').trim();
    var words = clean.split(/[\s ]+/).filter(function (w) {
      return w.length > 1 && !ORG_FORMS.test(w);
    });
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }

  var items = document.querySelectorAll('.page-projects__item');
  if (!items.length) return;

  items.forEach(function (item) {
    var clientEl = item.querySelector('.page-projects__item-client');
    var descEl   = item.querySelector('.page-projects__item-desc');
    var metaEl   = item.querySelector('.page-projects__item-meta');
    if (!clientEl) return;

    var imgSrc  = item.dataset.projectImage    || '';
    var imgFit  = item.dataset.projectImageFit || 'cover';
    var href    = item.dataset.projectHref     || '';
    var clientHTML = clientEl.innerHTML;
    var descHTML   = descEl  ? descEl.innerHTML  : '';
    var metaHTML   = metaEl  ? metaEl.innerHTML  : '';
    var clientText = clientEl.textContent || '';
    var accent     = (hashStr(clientText) % 5) + 1;
    var abbr       = initials(clientText);

    /* ── Медиа-область ────────────────────────────────────────────── */
    var mediaHTML;
    if (imgSrc && imgFit === 'contain') {
      /* Логотип по центру на светлом фоне */
      mediaHTML = '<div class="page-projects__item-media page-projects__item-media--logo">'
                + '<img class="page-projects__item-logo" src="' + imgSrc + '" alt="" loading="lazy" decoding="async">'
                + '<span class="page-projects__item-logo-fallback" aria-hidden="true">' + abbr + '</span>'
                + '</div>';
    } else if (imgSrc) {
      /* Фото на весь блок */
      mediaHTML = '<div class="page-projects__item-media page-projects__item-media--photo">'
                + '<img class="page-projects__item-photo" src="' + imgSrc + '" alt="" loading="lazy" decoding="async">'
                + '</div>';
    } else {
      /* Градиентный фон с инициалами */
      mediaHTML = '<div class="page-projects__item-media" data-accent="' + accent + '">'
                + '<span class="page-projects__item-logo-fallback" aria-hidden="true">' + abbr + '</span>'
                + '</div>';
    }

    /* ── Футер карточки ───────────────────────────────────────────── */
    var moreHTML = href
      ? '<a class="page-projects__item-more" href="' + href + '">Подробнее ' + ARROW + '</a>'
      : '';
    var footerHTML = '<div class="page-projects__item-footer">'
                   + '<span class="page-projects__item-tag">' + metaHTML + '</span>'
                   + moreHTML
                   + '</div>';

    /* ── Тело карточки ────────────────────────────────────────────── */
    var bodyHTML = '<div class="page-projects__item-body">'
                 + '<p class="page-projects__item-client">' + clientHTML + '</p>'
                 + '<p class="page-projects__item-desc">'   + descHTML   + '</p>'
                 + footerHTML
                 + '</div>';

    item.innerHTML = mediaHTML + bodyHTML;
    item.dataset.enhanced = '';

    /* Весь блок кликабелен, если есть страница кейса */
    if (href) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        window.location.href = href;
      });
    }
  });
})();
