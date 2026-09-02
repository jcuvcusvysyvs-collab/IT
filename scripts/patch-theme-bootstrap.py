"""Patch inline theme bootstrap: theme-color meta + viewport-fit=cover."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

INLINE_RE = re.compile(
    r'    <script>\s*\(function \(\) \{[\s\S]*?r\.classList\.add\("is-loading"\);[\s\S]*?\}\)\(\);\s*</script>',
    re.M,
)

NEW_INLINE = """    <script>
      (function () {
        var r = document.documentElement;
        var THEME_COLOR_LIGHT = "#f4f6fa";
        var THEME_COLOR_DARK = "#0a0e14";
        var dark = false;
        try {
          var mobile = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
          var t = localStorage.getItem(mobile ? "dc-site-theme-mobile" : "dc-site-theme");
          if (t === "dark" || (t !== "light" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            dark = true;
            r.setAttribute("data-theme", "dark");
          } else {
            r.removeAttribute("data-theme");
          }
        } catch (e) {}
        function ensureMeta(name, content) {
          var meta = document.querySelector('meta[name="' + name + '"]');
          if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", name);
            document.head.appendChild(meta);
          }
          meta.setAttribute("content", content);
        }
        ensureMeta("theme-color", dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
        ensureMeta("apple-mobile-web-app-status-bar-style", dark ? "black-translucent" : "default");
        r.classList.add("is-loading");
        r.setAttribute("aria-busy", "true");
      })();
    </script>"""

VIEWPORT_RE = re.compile(
    r'(<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=no)(")'
)


def main() -> int:
    changed: list[str] = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        orig = text
        if INLINE_RE.search(text):
            text = INLINE_RE.sub(NEW_INLINE, text, count=1)
        if "viewport-fit=cover" not in text:
            text = VIEWPORT_RE.sub(r"\1, viewport-fit=cover\2", text)
        if text != orig:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(path.name)
    print(f"Updated {len(changed)} HTML files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
