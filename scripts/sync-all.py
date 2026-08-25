#!/usr/bin/env python3
"""Sync shared footer, nav, and common asset versions across all HTML pages.

Source of truth:
  - _partials/footer-home.html      (index.html)
  - _partials/footer-subpage.html   (all other pages with .site-footer)
  - SERVICE/PROJECT/ABOUT link lists below (nav)
  - scripts/site-assets.json        (shared CSS/JS ?v=)

Usage:
  python scripts/sync-all.py
  python scripts/sync-all.py --check
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS_PATH = Path(__file__).resolve().parent / "site-assets.json"

FOOTER_RE = re.compile(r"[ \t]*<footer class=\"site-footer\"[\s\S]*?</footer>\s*", re.M)
NAV_PATTERN = re.compile(
    r'[ \t]*<nav class="nav" aria-label="Основное меню">.*?</nav>(?=\s*<div class="header-actions">)',
    re.DOTALL,
)

SERVICE_LINKS = [
    ("infrastructure-solutions.html", "Инфраструктурные решения"),
    ("information-security.html", "Информационная безопасность"),
    ("scaling-without-procurement.html", "Масштабирование без закупок"),
    ("business-continuity.html", "Обеспечение непрерывности"),
    ("operations-support.html", "Эксплуатация и сопровождение"),
    ("huawei-service-center.html", "Сервисный центр HUAWEI"),
    ("asdu-datacenter.html", "АСДУ"),
]

PROJECT_LINKS = [
    ("#projects-featured", "Ключевые проекты"),
    ("#projects-all", "Все проекты"),
]

ABOUT_LINKS = [
    ("#about-partners", "Наши партнёры"),
    ("#certificates", "Лицензии и сертификаты"),
    ("#career", "Карьера"),
]

# filename → service page href that should get aria-current="page"
SERVICE_CURRENT = {
    "huawei-service-center.html": "huawei-service-center.html",
    "infrastructure-solutions.html": "infrastructure-solutions.html",
    "information-security.html": "information-security.html",
    "scaling-without-procurement.html": "scaling-without-procurement.html",
    "business-continuity.html": "business-continuity.html",
    "operations-support.html": "operations-support.html",
    "asdu-datacenter.html": "asdu-datacenter.html",
}

SKIP_NAV = {"client-projects.html"}


def load_assets() -> dict[str, str]:
    data = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data:
        raise SystemExit(f"Invalid assets file: {ASSETS_PATH}")
    return {str(k): str(v) for k, v in data.items()}


def load_footer(name: str) -> str:
    text = (ROOT / "_partials" / name).read_text(encoding="utf-8").strip() + "\n"
    if not text.lstrip().startswith("<footer"):
        raise SystemExit(f"Partial is not a footer: {name}")
    if not text.startswith("    <footer"):
        text = "    " + text.lstrip()
    return text


def page_href(filename: str, page: str, anchor: str) -> str:
    if filename == page:
        return anchor
    return f"{page}{anchor}"


def build_submenu_items(filename: str, page: str, links: list[tuple[str, str]]) -> str:
    items = []
    for anchor, label in links:
        href = page_href(filename, page, anchor)
        items.append(
            "                  <li role=\"none\">\n"
            f'                    <a href="{href}" role="menuitem">{label}</a>\n'
            "                  </li>"
        )
    return "\n".join(items)


def build_nav(filename: str) -> str:
    is_index = filename == "index.html"
    clients_href = "#clients" if is_index else "index.html#clients"
    service_current = SERVICE_CURRENT.get(filename)

    service_items = []
    for href, label in SERVICE_LINKS:
        current = ' aria-current="page"' if service_current == href else ""
        service_items.append(
            "                  <li role=\"none\">\n"
            f'                    <a href="{href}" role="menuitem"{current}>{label}</a>\n'
            "                  </li>"
        )

    projects_current = ' aria-current="page"' if filename == "projects.html" else ""
    about_current = ' aria-current="page"' if filename == "about.html" else ""
    project_items = build_submenu_items(filename, "projects.html", PROJECT_LINKS)
    about_items = build_submenu_items(filename, "about.html", ABOUT_LINKS)

    return f"""        <nav class="nav" aria-label="Основное меню">
          <button
            type="button"
            class="nav-toggle"
            aria-expanded="false"
            aria-controls="nav-menu"
            aria-label="Открыть меню"
          >
            <span class="nav-toggle-bar" aria-hidden="true"></span>
            <span class="nav-toggle-bar" aria-hidden="true"></span>
            <span class="nav-toggle-bar" aria-hidden="true"></span>
          </button>

          <ul id="nav-menu" class="nav-menu">
            <li class="nav-item-has-submenu nav-item-drill nav-item-services">
              <button
                type="button"
                class="nav-submenu-trigger"
                aria-expanded="false"
                aria-controls="submenu-services"
                id="services-menu-button"
              >
                Услуги
                <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
              <div id="submenu-services" class="nav-submenu nav-submenu--mega" aria-labelledby="services-menu-button">
                <div class="nav-submenu-panel">
                  <ul class="nav-submenu-links" role="menu">
{chr(10).join(service_items)}
                  </ul>
                </div>
              </div>
            </li>
            <li class="nav-item-has-submenu nav-item-drill nav-item-projects">
              <button
                type="button"
                class="nav-submenu-trigger"
                aria-expanded="false"
                aria-controls="submenu-projects"
                id="projects-menu-button"{projects_current}
              >
                Проекты
                <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
              <div id="submenu-projects" class="nav-submenu nav-submenu--panel" aria-labelledby="projects-menu-button">
                <div class="nav-submenu-panel">
                  <ul class="nav-submenu-links" role="menu">
{project_items}
                  </ul>
                </div>
              </div>
            </li>
            <li><a href="{clients_href}">Заказчики</a></li>
            <li class="nav-item-has-submenu nav-item-drill nav-item-about">
              <button
                type="button"
                class="nav-submenu-trigger"
                aria-expanded="false"
                aria-controls="submenu-about"
                id="about-menu-button"{about_current}
              >
                О компании
                <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
              <div id="submenu-about" class="nav-submenu nav-submenu--panel" aria-labelledby="about-menu-button">
                <div class="nav-submenu-panel">
                  <ul class="nav-submenu-links" role="menu">
{about_items}
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </nav>"""


def ensure_script(text: str, filename: str, version: str) -> str:
    src = f"{filename}?v={version}"
    if f'src="{filename}' in text or f"src='{filename}" in text:
        return re.sub(
            rf'(src=["\']){re.escape(filename)}(?:\?v=[^"\']*)?(["\'])',
            rf"\1{src}\2",
            text,
        )
    return text.replace(
        "</body>",
        f'    <script defer src="{src}"></script>\n  </body>',
        1,
    )


def apply_asset_versions(text: str, assets: dict[str, str]) -> str:
    for name, version in assets.items():
        if name.endswith(".css"):
            text = re.sub(
                rf'(href=["\']){re.escape(name)}(?:\?v=[^"\']*)?(["\'])',
                rf"\1{name}?v={version}\2",
                text,
            )
        elif name.endswith(".js"):
            if name in ("footer-dot-matrix.js", "footer-mos-widget.js"):
                text = ensure_script(text, name, version)
            else:
                text = re.sub(
                    rf'(src=["\']){re.escape(name)}(?:\?v=[^"\']*)?(["\'])',
                    rf"\1{name}?v={version}\2",
                    text,
                )
    return text


def sync_text(
    path: Path,
    text: str,
    *,
    home_footer: str,
    sub_footer: str,
    assets: dict[str, str],
) -> str:
    name = path.name

    if '<footer class="site-footer"' in text:
        footer = home_footer if name == "index.html" else sub_footer
        new_text, n = FOOTER_RE.subn(footer, text, count=1)
        if n == 1:
            text = new_text

    if name not in SKIP_NAV and '<nav class="nav" aria-label="Основное меню">' in text:
        text = NAV_PATTERN.sub(build_nav(name), text, count=1)

    text = apply_asset_versions(text, assets)
    return text


def iter_pages() -> list[Path]:
    return sorted(ROOT.glob("*.html"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync shared layout across HTML pages")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit with code 1 if pages differ from the source of truth (no writes)",
    )
    args = parser.parse_args()

    assets = load_assets()
    home_footer = load_footer("footer-home.html")
    sub_footer = load_footer("footer-subpage.html")

    changed: list[str] = []
    checked = 0

    for path in iter_pages():
        original = path.read_text(encoding="utf-8")
        updated = sync_text(
            path,
            original,
            home_footer=home_footer,
            sub_footer=sub_footer,
            assets=assets,
        )
        checked += 1
        if updated == original:
            continue
        changed.append(path.name)
        if not args.check:
            path.write_text(updated, encoding="utf-8", newline="\n")

    if args.check:
        if changed:
            print(f"DRIFT: {len(changed)} page(s) out of sync:")
            for name in changed:
                print(f"  - {name}")
            print("Run: python scripts/sync-all.py")
            return 1
        print(f"OK: {checked} page(s) match source of truth")
        return 0

    print(f"Updated {len(changed)} / {checked} page(s)")
    for name in changed:
        print(f"  - {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
