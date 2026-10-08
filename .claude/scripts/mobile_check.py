"""Mobile validation for web and admin.

Emulates an iPhone 13 (390x844, touch) with Playwright and, for each app:
- takes a full-page screenshot,
- reports elements that overflow the viewport horizontally,
- reports console errors and page exceptions,
- if the header has a mobile menu, opens it and takes a screenshot.

The dev servers must already be running (web on :3000, admin on :3001).

Usage:
    ~/.venvs/playwright/bin/python .claude/scripts/mobile_check.py <output_dir> [path]
"""

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

APPS = {"web": "http://localhost:3000", "admin": "http://localhost:3001"}

OVERFLOW_JS = """() => {
  const width = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll('body *')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > width + 1 || r.left < -1);
    })
    .slice(0, 10)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}`);
  return { width, scrollWidth: document.documentElement.scrollWidth, offenders };
}"""


def check_app(playwright, name, base_url, path, out_dir):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(**playwright.devices["iPhone 13"])
    page = context.new_page()

    errors = []
    page.on("console", lambda msg: msg.type == "error" and errors.append(msg.text))
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.goto(base_url + path)
    page.wait_for_load_state("networkidle")

    page.screenshot(path=str(out_dir / f"{name}-mobile.png"), full_page=True)
    overflow = page.evaluate(OVERFLOW_JS)

    menu_button = page.get_by_role("button", name="Abrir menú")
    has_menu = menu_button.count() > 0 and menu_button.is_visible()
    if has_menu:
        menu_button.tap()
        page.wait_for_timeout(500)
        page.screenshot(path=str(out_dir / f"{name}-mobile-menu.png"))

    browser.close()
    return {
        "url": base_url + path,
        "viewport": overflow["width"],
        "scrollWidth": overflow["scrollWidth"],
        "horizontalOverflow": overflow["scrollWidth"] > overflow["width"],
        "overflowingElements": overflow["offenders"],
        "consoleErrors": errors,
        "mobileMenu": has_menu,
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    path = sys.argv[2] if len(sys.argv) > 2 else "/"

    with sync_playwright() as playwright:
        report = {name: check_app(playwright, name, url, path, out_dir) for name, url in APPS.items()}

    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nScreenshots in: {out_dir}")


if __name__ == "__main__":
    main()
