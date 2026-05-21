import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "miniapp" / "static" / "index.html"
STYLES = ROOT / "miniapp" / "static" / "styles.css"


class MiniAppDesignTest(unittest.TestCase):
    def test_miniapp_uses_site_style_tokens_and_structure(self):
        html = INDEX.read_text(encoding="utf-8")
        css = STYLES.read_text(encoding="utf-8")

        self.assertIn("brand-mark", html)
        self.assertIn("/miniapp/static/assets/umniremont-logo-white.svg", html)
        self.assertIn("/miniapp/static/brand/favicon.svg", html)
        self.assertIn("film-grain", html)
        self.assertIn("hero-cta-row", html)
        self.assertIn("site-shell", html)
        self.assertIn("--brand-dark: #0a0a0a", css)
        self.assertIn("--brand-light: #f5f5f0", css)
        self.assertIn("--brand-accent: #c5a059", css)
        self.assertIn(".brand-logo", css)
        self.assertIn(".film-grain", css)
        self.assertRegex(css, re.compile(r"\.hero\s*\{[^}]*min-height:\s*min\(72vh,\s*720px\)", re.S))
        self.assertIn("cabinet-card", html)
        self.assertNotIn("стеклян", css.lower())


if __name__ == "__main__":
    unittest.main()
