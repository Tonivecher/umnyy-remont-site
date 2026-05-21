#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import os
import sys
import types
from pathlib import Path

from aiogram import Bot, Dispatcher


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


os.environ.setdefault("TELEGRAM_TOKEN", "123456:TEST_TOKEN")
os.environ.setdefault("ADMIN_ID", "1")
os.environ.setdefault("GOOGLE_CREDENTIALS", '{"test":"1"}')
os.environ.setdefault("DATABASE_URL", "")

google_sheets_stub = types.ModuleType("services.google_sheets")


def add_lead(_: dict) -> None:
    return None


google_sheets_stub.add_lead = add_lead
sys.modules["services.google_sheets"] = google_sheets_stub

import main


async def _fake_start_polling(self, *args, **kwargs):  # type: ignore[no-untyped-def]
    return None


async def _fake_delete_webhook(self, *args, **kwargs):  # type: ignore[no-untyped-def]
    return True


async def _fake_set_webhook(self, *args, **kwargs):  # type: ignore[no-untyped-def]
    return True


async def run() -> None:
    original_start_polling = Dispatcher.start_polling
    original_delete_webhook = Bot.delete_webhook
    original_set_webhook = Bot.set_webhook
    try:
        Dispatcher.start_polling = _fake_start_polling  # type: ignore[assignment]
        Bot.delete_webhook = _fake_delete_webhook  # type: ignore[assignment]
        Bot.set_webhook = _fake_set_webhook  # type: ignore[assignment]
        await main.main()
    finally:
        Dispatcher.start_polling = original_start_polling  # type: ignore[assignment]
        Bot.delete_webhook = original_delete_webhook  # type: ignore[assignment]
        Bot.set_webhook = original_set_webhook  # type: ignore[assignment]


def entrypoint() -> None:
    asyncio.run(run())
    print("OK")


if __name__ == "__main__":
    entrypoint()
