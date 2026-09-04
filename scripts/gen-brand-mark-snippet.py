"""Generate inline brand mark snippet for footer partials."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
svg = (ROOT / "images" / "logoVertical.svg").read_text(encoding="utf-8")
match = re.search(r'd="(M[^"]+)"', svg)
if not match:
    raise SystemExit("path not found")
path = match.group(1)
# Full logo disk spans y≈16–164 in the 220px source canvas.
view_box = "0 10 180 158"
snippet = f"""            <span class="footer-newsletter-strip__brand-mark" aria-hidden="true">
              <svg class="footer-newsletter-strip__brand-mark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" focusable="false">
                <path fill="currentColor" d="{path}" />
              </svg>
            </span>"""
(ROOT / "_partials" / "_brand-mark-snippet.txt").write_text(snippet, encoding="utf-8")
print("ok", len(snippet))
