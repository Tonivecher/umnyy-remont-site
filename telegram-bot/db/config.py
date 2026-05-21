import os
from pathlib import Path

from dotenv import load_dotenv


DEFAULT_SQLITE_PATH = "data/app.sqlite"


def _is_production() -> bool:
    return os.getenv("ENV", "").lower() == "production"


if not _is_production():
    load_dotenv()


def get_database_url() -> str | None:
    value = os.getenv("DATABASE_URL")
    if not value:
        return None
    value = value.strip()
    return value or None


def get_sqlite_path() -> Path:
    raw_path = os.getenv("SQLITE_PATH", DEFAULT_SQLITE_PATH).strip()
    if not raw_path:
        raw_path = DEFAULT_SQLITE_PATH
    return Path(raw_path)
