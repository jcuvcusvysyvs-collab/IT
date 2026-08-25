(function () {
  var toastTimer = null;
  var toastEl = null;

  function getShareData() {
    var url = window.location.href.split("#")[0];
    var title = (document.title || "").trim();
    return { url: url, title: title };
  }

  function buildHref(network, data) {
    var encodedUrl = encodeURIComponent(data.url);
    var encodedTitle = encodeURIComponent(data.title);
    if (network === "telegram") {
      return "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedTitle;
    }
    if (network === "whatsapp") {
      return "https://wa.me/?text=" + encodeURIComponent(data.title + "\n" + data.url);
    }
    if (network === "vk") {
      return "https://vk.com/share.php?url=" + encodedUrl + "&title=" + encodedTitle;
    }
    return "#";
  }

  function ensureToast() {
    if (toastEl && document.body.contains(toastEl)) return toastEl;

    toastEl = document.createElement("div");
    toastEl.className = "page-share-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.hidden = true;
    toastEl.innerHTML =
      '<span class="page-share-toast__icon" aria-hidden="true">' +
      '<svg width="18" height="18" viewBox="0 0 16 16" fill="none">' +
      '<path fill="currentColor" d="M5.5 2.5A1.5 1.5 0 0 0 4 4v7.5A1.5 1.5 0 0 0 5.5 13h5A1.5 1.5 0 0 0 12 11.5V4A1.5 1.5 0 0 0 10.5 2.5h-5Zm0 1h5a.5.5 0 0 1 .5.5v7.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"/>' +
      '<path fill="currentColor" d="M3 4.75A.75.75 0 0 0 2.25 5.5v6.75A2.25 2.25 0 0 0 4.5 14.5h5.75a.75.75 0 0 0 0-1.5H4.5a.75.75 0 0 1-.75-.75V5.5A.75.75 0 0 0 3 4.75Z"/>' +
      "</svg>" +
      "</span>" +
      '<span class="page-share-toast__text">Ссылка скопирована</span>' +
      '<button type="button" class="page-share-toast__close" aria-label="Закрыть">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
      '<path fill="currentColor" d="M2.47 1.41a.75.75 0 0 0-1.06 1.06L4.94 6 1.41 9.53a.75.75 0 1 0 1.06 1.06L6 7.06l3.53 3.53a.75.75 0 0 0 1.06-1.06L7.06 6l3.53-3.53a.75.75 0 0 0-1.06-1.06L6 4.94 2.47 1.41Z"/>' +
      "</svg>" +
      "</button>";

    toastEl.querySelector(".page-share-toast__close").addEventListener("click", hideToast);
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function hideToast() {
    if (!toastEl) return;
    toastEl.classList.remove("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      if (toastEl) toastEl.hidden = true;
    }, 280);
  }

  function showToast() {
    var el = ensureToast();
    window.clearTimeout(toastTimer);
    el.hidden = false;
    // restart animation
    el.classList.remove("is-visible");
    void el.offsetWidth;
    el.classList.add("is-visible");
    toastTimer = window.setTimeout(hideToast, 3200);
  }

  function fallbackCopy(url, done) {
    var input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {}
    document.body.removeChild(input);
  }

  function copyLink(url) {
    var done = function () {
      showToast();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {
        fallbackCopy(url, done);
      });
      return;
    }
    fallbackCopy(url, done);
  }

  function initShare(root) {
    var data = getShareData();
    root.querySelectorAll("[data-share]").forEach(function (el) {
      var network = el.getAttribute("data-share");
      if (network === "copy") {
        el.addEventListener("click", function () {
          copyLink(data.url);
        });
        return;
      }
      el.setAttribute("href", buildHref(network, data));
    });
  }

  function boot() {
    document.querySelectorAll(".page-share").forEach(initShare);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
