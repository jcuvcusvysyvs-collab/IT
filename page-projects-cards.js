/**
 * Карточки каталога проектов.
 */
(function () {
  const VERSION = "184";
  const DEFAULT_HREF = "contacts.html";

  const legalPrefix =
    /^(ООО|АО|ПАО|ФГУП|ФКУ|ГБУ|ФГБУ|ЗАО|ГУП|ОДК|ФАУ|ПАО\s+АКБ)\s+/i;

  const arrowSvg =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function plainText(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function getInitials(client) {
    const quoted = client.match(/«([^»]+)»/);
    let name = quoted ? quoted[1] : client.replace(legalPrefix, "").trim();
    if (!name) name = client;

    const words = name.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w));
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toLocaleUpperCase("ru-RU");
    }
    const letters = name.replace(/[^\p{L}\d]/gu, "");
    return letters.slice(0, 2).toLocaleUpperCase("ru-RU") || "DC";
  }

  function normalizeYears(raw) {
    if (!raw) return "";
    const cleaned = raw.replace(/[–—]/g, "-").trim();
    if (/^до\s*\d{4}$/i.test(cleaned)) {
      return cleaned.replace(/^до/i, "до").replace(/\s+/, " ");
    }

    const rangeMatch = cleaned.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
    if (rangeMatch) {
      const start = rangeMatch[1];
      let end = rangeMatch[2];
      if (end.length === 2) end = start.slice(0, 2) + end;
      return `${start}–${end}`;
    }

    if (/^\d{4}$/.test(cleaned)) return cleaned;

    return cleaned.replace(/\s*-\s*/g, "–");
  }

  function getYearGroupLabel(item) {
    const group = item.closest(".page-projects__year-group");
    const label = group?.querySelector(".page-projects__year-num");
    return plainText(label);
  }

  function formatMeta(meta, yearGroupLabel) {
    let place = meta.trim();
    let years = "";

    if (/[·,]/.test(meta)) {
      const parts = meta.split(/[·,]/).map((p) => p.trim()).filter(Boolean);
      place = parts[0] || "";
      years = parts.slice(1).join(" ");
    }

    years = normalizeYears(years || yearGroupLabel);

    if (place && years) return `${place}, ${years}`;
    if (place) return place;
    return years;
  }

  function readSource(item) {
    const clientEl = item.querySelector(".page-projects__item-client");
    const descEl = item.querySelector(".page-projects__item-desc");
    const metaEl =
      item.querySelector(".page-projects__item-meta") ||
      item.querySelector(".page-projects__item-tag");

    const descOverride = item.dataset.projectDesc?.trim();

    if (clientEl && descEl) {
      return {
        client: plainText(clientEl),
        desc: descOverride || plainText(descEl),
        meta: plainText(metaEl),
        href: item.dataset.projectHref || DEFAULT_HREF,
      };
    }

    if (item.dataset.projectClient) {
      return {
        client: item.dataset.projectClient,
        desc: item.dataset.projectDesc || "",
        meta: item.dataset.projectMeta || "",
        href: item.dataset.projectHref || DEFAULT_HREF,
      };
    }

    return {
      client: "",
      desc: "",
      meta: "",
      href: item.dataset.projectHref || DEFAULT_HREF,
    };
  }

  function storeSource(item, data) {
    item.dataset.projectClient = data.client;
    item.dataset.projectDesc = data.desc;
    item.dataset.projectMeta = data.meta;
  }

  function isDarkTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function applyProjectPhotoTheme(photo) {
    const light = photo.dataset.srcLight;
    const dark = photo.dataset.srcDark;
    if (!light) return;
    photo.src = isDarkTheme() && dark ? dark : light;
  }

  function syncAllProjectPhotos() {
    document.querySelectorAll(".page-projects__item-photo[data-src-dark]").forEach(applyProjectPhotoTheme);
  }

  function watchThemeChanges() {
    if (watchThemeChanges._ready) return;
    watchThemeChanges._ready = true;

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.attributeName === "data-theme") {
          syncAllProjectPhotos();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function enhanceProjectCards(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const items = scope.querySelectorAll
      ? scope.querySelectorAll(".page-projects__item")
      : document.querySelectorAll(".page-projects__item");

    items.forEach(function (item, index) {
      if (item.getAttribute("data-cards-v") === VERSION) return;

      const source = readSource(item);
      if (!source.client || !source.desc) return;

      storeSource(item, source);

      const formattedMeta = formatMeta(source.meta, getYearGroupLabel(item));
      const href = item.dataset.projectHref || DEFAULT_HREF;

      const media = document.createElement("div");
      media.className = "page-projects__item-media";
      media.setAttribute("data-accent", String(index % 6));
      media.setAttribute("aria-hidden", "true");

      const imageSrc = item.dataset.projectImage?.trim();
      const imageSrcDark = item.dataset.projectImageDark?.trim();
      if (imageSrc) {
        const fit = (item.dataset.projectImageFit || "contain").toLowerCase();
        const isCover = fit === "cover";
        media.classList.add(
          isCover ? "page-projects__item-media--brand" : "page-projects__item-media--logo"
        );
        if (imageSrcDark) {
          media.setAttribute("data-has-dark-image", "true");
          const darkBg = item.dataset.projectImageDarkBg?.trim();
          if (darkBg) {
            media.style.setProperty("--project-dark-image-bg", darkBg);
          }
        }
        const photo = document.createElement("img");
        photo.className = "page-projects__item-photo";
        photo.dataset.srcLight = imageSrc;
        if (imageSrcDark) {
          photo.dataset.srcDark = imageSrcDark;
        }
        applyProjectPhotoTheme(photo);
        photo.alt = "";
        photo.loading = "lazy";
        photo.decoding = "async";
        media.appendChild(photo);
      } else {
        const existingLogo = item.querySelector(".page-projects__item-logo");
        if (existingLogo) {
          media.appendChild(existingLogo.cloneNode(true));
        } else {
          const fallback = document.createElement("span");
          fallback.className = "page-projects__item-logo-fallback";
          fallback.textContent = getInitials(source.client);
          media.appendChild(fallback);
        }
      }

      const body = document.createElement("div");
      body.className = "page-projects__item-body";

      const title = document.createElement("p");
      title.className = "page-projects__item-client";
      title.textContent = source.client;

      const text = document.createElement("p");
      text.className = "page-projects__item-desc";
      text.textContent = source.desc;

      const footer = document.createElement("div");
      footer.className = "page-projects__item-footer";

      const tag = document.createElement("span");
      tag.className = "page-projects__item-tag";
      tag.textContent = formattedMeta;

      const more = document.createElement("a");
      more.className = "page-projects__item-more";
      more.href = href;
      more.innerHTML = "Подробнее" + arrowSvg;

      footer.appendChild(tag);
      footer.appendChild(more);
      body.append(title, text, footer);
      item.replaceChildren(media, body);
      item.setAttribute("data-cards-v", VERSION);
      item.setAttribute("data-enhanced", "");
    });
  }

  window.enhanceProjectCards = enhanceProjectCards;

  watchThemeChanges();

  if (!document.getElementById("projects-filter")) {
    function init() {
      enhanceProjectCards(document);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
