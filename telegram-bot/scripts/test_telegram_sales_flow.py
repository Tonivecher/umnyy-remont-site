import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("TELEGRAM_TOKEN", "123456:TEST_TOKEN_FOR_DRY_RUN")
os.environ.setdefault("ADMIN_ID", "123")

import config  # noqa: E402
from services import google_sheets  # noqa: E402


class TelegramSalesFlowTest(unittest.TestCase):
    def test_public_links_default_to_umniy_remont_assets(self):
        self.assertEqual(config.BOT_PUBLIC_URL, "https://t.me/umniyremontbot")
        self.assertEqual(config.TELEGRAM_CHANNEL_URL, "https://t.me/proumniremont")
        self.assertEqual(config.PUBLIC_SITE_URL, "https://umniremont.pro")
        self.assertNotIn("smartrepair", config.MINI_APP_URL.lower())

    def test_google_sheets_row_keeps_legacy_columns_and_adds_attribution(self):
        rows = []

        class FakeSheet:
            def append_row(self, row):
                rows.append(row)

        old_sheet = google_sheets._sheet
        old_initialized = google_sheets._initialized
        old_init = getattr(google_sheets, "_init_google_sheets")
        try:
            google_sheets._sheet = FakeSheet()
            google_sheets._initialized = True
            setattr(google_sheets, "_init_google_sheets", lambda: None)
            google_sheets.add_lead(
                {
                    "name": "Иван",
                    "phone": "+79990000000",
                    "address": "Москва",
                    "area": "55",
                    "budget": "до 3 млн",
                    "source": "estimate_site_hero",
                    "telegram_username": "@client",
                    "telegram_user_id": "42",
                    "telegram_full_name": "Иван Петров",
                    "preferred_tier": "standard",
                    "estimate_summary": "2 комнаты",
                }
            )
        finally:
            google_sheets._sheet = old_sheet
            google_sheets._initialized = old_initialized
            setattr(google_sheets, "_init_google_sheets", old_init)

        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row[1:7], ["Иван", "+79990000000", "Москва", "55", "до 3 млн", "estimate_site_hero"])
        self.assertEqual(row[7:12], ["@client", "42", "Иван Петров", "standard", "2 комнаты"])


if __name__ == "__main__":
    unittest.main()
