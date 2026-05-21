import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "miniapp" / "static" / "index.html"
STYLES = ROOT / "miniapp" / "static" / "styles.css"
LOGO_MARK = ROOT / "miniapp" / "static" / "assets" / "umniremont-logo-mark.svg"


class MiniAppDesignTest(unittest.TestCase):
    def test_miniapp_uses_site_style_tokens_and_structure(self):
        html = INDEX.read_text(encoding="utf-8")
        css = STYLES.read_text(encoding="utf-8")

        self.assertIn('class="brand-mark"', html)
        self.assertIn("/miniapp/static/assets/umniremont-logo-mark.svg", html)
        self.assertIn("hero-cta-row", html)
        self.assertIn("site-shell", html)
        self.assertIn("--bg-base: #030303", css)
        self.assertIn("--bg-surface: #0a0a0a", css)
        self.assertIn("--accent-primary: #d4c4a8", css)
        self.assertIn(".brand-mark img", css)
        self.assertTrue(LOGO_MARK.exists())
        self.assertNotIn("кабинет", html.lower())
        self.assertNotIn("стеклян", css.lower())


if __name__ == "__main__":
    unittest.main()
