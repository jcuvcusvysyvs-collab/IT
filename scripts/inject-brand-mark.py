"""Inject inline brand mark SVG into footer partials."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
snippet = (ROOT / "_partials" / "_brand-mark-snippet.txt").read_text(encoding="utf-8")
old = '            <span class="footer-newsletter-strip__brand-mark" aria-hidden="true"></span>'

for name in ("footer-home.html", "footer-subpage.html"):
    path = ROOT / "_partials" / name
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"missing placeholder in {name}")
    path.write_text(text.replace(old, snippet.rstrip(), 1), encoding="utf-8", newline="\n")
    print("updated", name)
