(function () {
  "use strict";

  var STORAGE_KEY = "dce-cookie-consent";
  /* When the policy page is ready, set e.g. "cookie-policy.html" */
  var POLICY_HREF = "";

  var root = null;
  var shown = false;

  function readStatus() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === "accepted" || value === "rejected") return value;
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function publish(status) {
    var detail = {
      status: status,
      canAnalytics: status === "accepted",
    };
    window.__dceCookieConsent = detail;
    try {
      document.dispatchEvent(
        new CustomEvent("dce-cookie-consent", { detail: detail })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function save(status) {
    try {
      localStorage.setItem(STORAGE_KEY, status);
    } catch (e) {
      /* ignore */
    }
    publish(status);
  }

  function canLoadAnalytics() {
    return readStatus() === "accepted";
  }

  window.__dceCookieConsentApi = {
    getStatus: readStatus,
    canLoadAnalytics: canLoadAnalytics,
    STORAGE_KEY: STORAGE_KEY,
  };

  var existing = readStatus();
  if (existing) {
    publish(existing);
    return;
  }

  function policyMarkup() {
    var label = "политикой использования файлов cookie";
    if (POLICY_HREF) {
      return (
        '<a class="cookie-banner__link" href="' +
        POLICY_HREF +
        '">' +
        label +
        "</a>"
      );
    }
    return (
      '<a class="cookie-banner__link cookie-banner__link--pending" href="#" role="link" aria-disabled="true" tabindex="-1">' +
      label +
      "</a>"
    );
  }

  function hide() {
    if (!root) return;
    root.classList.remove("is-visible");
    root.setAttribute("aria-hidden", "true");
    window.setTimeout(function () {
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
      shown = false;
    }, 420);
  }

  function onChoice(status) {
    save(status);
    hide();
  }

  function mount() {
    if (shown || root || readStatus()) return;
    if (!document.body) {
      requestAnimationFrame(mount);
      return;
    }

    shown = true;
    root = document.createElement("aside");
    root.className = "cookie-banner";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-labelledby", "cookie-banner-title");
    root.setAttribute("aria-hidden", "true");

    root.innerHTML =
      '<div class="cookie-banner__card">' +
      '<h2 class="cookie-banner__title" id="cookie-banner-title">Настройки cookie</h2>' +
      '<p class="cookie-banner__text">' +
      "Мы используем файлы cookie для улучшения вашего опыта, анализа трафика сайта и предоставления персонализированного контента. Ознакомьтесь с нашей " +
      policyMarkup() +
      "." +
      "</p>" +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--reject" data-cookie-reject>Отклонить</button>' +
      '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept" data-cookie-accept>Принимаю</button>' +
      "</div>" +
      "</div>";

    var rejectBtn = root.querySelector("[data-cookie-reject]");
    var acceptBtn = root.querySelector("[data-cookie-accept]");
    var policyLink = root.querySelector(".cookie-banner__link--pending");

    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        onChoice("rejected");
      });
    }
    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        onChoice("accepted");
      });
    }
    if (policyLink) {
      policyLink.addEventListener("click", function (event) {
        event.preventDefault();
      });
    }

    document.body.appendChild(root);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!root) return;
        root.classList.add("is-visible");
        root.setAttribute("aria-hidden", "false");
      });
    });
  }

  function whenLoaderDone(run) {
    if (window.__dcePageLoaderDone) {
      run();
      return;
    }
    if (
      !document.documentElement.classList.contains("is-loading") &&
      !document.querySelector(".page-loader")
    ) {
      run();
      return;
    }
    document.addEventListener("dce-page-loader-done", run, { once: true });
    window.setTimeout(run, 8000);
  }

  function boot() {
    whenLoaderDone(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
