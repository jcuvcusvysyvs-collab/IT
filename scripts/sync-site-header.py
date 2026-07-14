#!/usr/bin/env python3
"""Sync header nav markup and asset versions across all HTML pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLES_VER = "20260714-hero-no-accent"
NAV_VER = "20260710-subnav-header-lock"

SERVICE_LINKS = [
    ("infrastructure-solutions.html", "Инфраструктурные решения"),
    ("information-security.html", "Информационная безопасность"),
    ("scaling-without-procurement.html", "Масштабирование без закупок"),
    ("business-continuity.html", "Обеспечение непрерывности"),
    ("operations-support.html", "Эксплуатация и сопровождение"),
    ("huawei-service-center.html", "Сервисный центр HUAWEI"),
    ("asdu-datacenter.html", "АСДУ ЦОД"),
]

PAGE_CURRENT = {
    "about.html": ("about.html", None),
    "projects.html": ("projects.html", None),
    "huawei-service-center.html": ("huawei-service-center.html", None),
    "infrastructure-solutions.html": ("infrastructure-solutions.html", None),
    "information-security.html": ("information-security.html", None),
    "scaling-without-procurement.html": ("scaling-without-procurement.html", None),
    "business-continuity.html": ("business-continuity.html", None),
    "operations-support.html": ("operations-support.html", None),
}


def build_nav(filename: str) -> str:
    is_index = filename == "index.html"
    projects_href = "projects.html"
    clients_href = "#clients" if is_index else "index.html#clients"

    service_current, _huawei_current = PAGE_CURRENT.get(filename, (None, None))

    service_items = []
    for href, label in SERVICE_LINKS:
        current = ' aria-current="page"' if service_current == href else ""
        service_items.append(
            f'                  <li role="none">\n'
            f'                    <a href="{href}" role="menuitem"{current}>{label}</a>\n'
            f"                  </li>"
        )

    projects_current = ' aria-current="page"' if service_current == "projects.html" else ""
    about_current = ' aria-current="page"' if service_current == "about.html" else ""

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
            <li class="nav-item-has-submenu">
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
            <li><a href="{projects_href}"{projects_current}>Проекты</a></li>
            <li><a href="{clients_href}">Заказчики</a></li>
            <li><a href="about.html"{about_current}>О компании</a></li>
          </ul>
        </nav>"""


NAV_PATTERN = re.compile(
    r"<nav class=\"nav\" aria-label=\"Основное меню\">.*?</nav>(?=\s*<div class=\"header-actions\">)",
    re.DOTALL,
)


def sync_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    text = re.sub(r"styles\.css\?v=[^\"']+", f"styles.css?v={STYLES_VER}", text)
    text = re.sub(r"nav\.js\?v=[^\"']+", f"nav.js?v={NAV_VER}", text)

    if '<nav class="nav" aria-label="Основное меню">' in text:
        text = NAV_PATTERN.sub(build_nav(path.name), text, count=1)

    if text != original:
        path.write_text(text, encoding="utf-8", newline="\n")
        return True
    return False


def main() -> None:
    changed = []
    for path in sorted(ROOT.glob("*.html")):
        if path.name == "client-projects.html":
            continue
        if sync_file(path):
            changed.append(path.name)

    print(f"Updated {len(changed)} files")
    for name in changed:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
