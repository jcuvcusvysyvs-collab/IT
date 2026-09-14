#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сборка ZIP для заливки на рег.ру.

Пример:
  python scripts/make-deploy-zip.py --domain=engiineer.space
  python scripts/make-deploy-zip.py --domain=dce.su --allow-index
"""

from __future__ import annotations

import argparse
import datetime as dt
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]

EXCLUDE_DIRS = {
    ".git",
    "scripts",
    "_partials",
    "__pycache__",
    "data",
    "node_modules",
    ".cursor",
}

EXCLUDE_FILES = {
    ".gitignore",
    ".nojekyll",
    "update.bat",
    "_bump_and_check.py",
    "lottie.min.js",
    "site-structure.json",
}

EXCLUDE_PATH_SUFFIXES = {
    "video/data-center-Q3B4L7N.mp4",
}

SKIP_HTML = {
    # partials live under _partials/ already excluded
}


def normalize_domain(raw: str) -> str:
    d = raw.strip().lower()
    d = d.replace("https://", "").replace("http://", "")
    d = d.split("/")[0].strip(".")
    if not d or " " in d:
        raise SystemExit("Укажите корректный --domain, например engiineer.space")
    return d


def collect_html_pages() -> list[str]:
    pages = []
    for p in sorted(ROOT.glob("*.html")):
        if p.name in SKIP_HTML:
            continue
        pages.append(p.name)
    return pages


def write_robots(domain: str, allow_index: bool) -> str:
    if allow_index:
        body = (
            "User-agent: *\n"
            "Allow: /\n"
            f"Sitemap: https://{domain}/sitemap.xml\n"
        )
    else:
        body = (
            "User-agent: *\n"
            "Disallow: /\n"
            f"# Тестовый хост {domain} — закрыт от индексации\n"
            f"Sitemap: https://{domain}/sitemap.xml\n"
        )
    (ROOT / "robots.txt").write_text(body, encoding="utf-8")
    return body


def write_sitemap(domain: str, pages: list[str]) -> str:
    today = dt.date.today().isoformat()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    # index first
    ordered = ["index.html"] + [p for p in pages if p != "index.html"]
    for name in ordered:
        if name == "404.html":
            continue
        loc = f"https://{domain}/" if name == "index.html" else f"https://{domain}/{name}"
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(loc)}</loc>")
        lines.append(f"    <lastmod>{today}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    lines.append("")
    body = "\n".join(lines)
    (ROOT / "sitemap.xml").write_text(body, encoding="utf-8")
    return body


def should_skip(rel: Path) -> bool:
    parts = set(rel.parts)
    if parts & EXCLUDE_DIRS:
        return True
    if rel.name in EXCLUDE_FILES:
        return True
    if rel.as_posix() in EXCLUDE_PATH_SUFFIXES:
        return True
    if rel.suffix == ".py" and rel.parent == ROOT:
        return True
    if rel.name.endswith(".zip") and rel.parent == ROOT:
        return True
    if rel.name == "DEPLOY-REGRU.md":
        return True
    return False


def build_zip(out_path: Path) -> int:
    count = 0
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in ROOT.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(ROOT)
            if should_skip(rel):
                continue
            zf.write(path, rel.as_posix())
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="ZIP для заливки на рег.ру")
    parser.add_argument(
        "--domain",
        required=True,
        help="Домен сайта, например engiineer.space или dce.su",
    )
    parser.add_argument(
        "--allow-index",
        action="store_true",
        help="Открыть robots для индексации (для dce.su). Для теста по умолчанию закрыто.",
    )
    parser.add_argument(
        "--out",
        default="",
        help="Путь к ZIP (по умолчанию deploy-<domain>-YYYYMMDD.zip в корне)",
    )
    args = parser.parse_args()

    domain = normalize_domain(args.domain)
    allow_index = bool(args.allow_index) or domain == "dce.su"

    pages = collect_html_pages()
    write_robots(domain, allow_index)
    write_sitemap(domain, pages)

    stamp = dt.date.today().strftime("%Y%m%d")
    out_name = args.out.strip() or f"deploy-{domain.replace('.', '-')}-{stamp}.zip"
    out_path = Path(out_name)
    if not out_path.is_absolute():
        out_path = ROOT / out_path

    if out_path.exists():
        out_path.unlink()

    count = build_zip(out_path)
    mode = "Allow" if allow_index else "Disallow"
    print(f"OK: {out_path}")
    print(f"files: {count}")
    print(f"domain: {domain}")
    print(f"robots: {mode}")
    print(f"pages in sitemap: {len([p for p in pages if p != '404.html'])}")


if __name__ == "__main__":
    main()
