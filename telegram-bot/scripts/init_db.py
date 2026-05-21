#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from db import Database
from db.config import get_database_url


async def run_init() -> None:
    database_url = get_database_url()
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is required for scripts/init_db.py. "
            "Set it to your Postgres connection URL."
        )

    database = Database(database_url=database_url)
    try:
        print(database.startup_log_line())
        await database.create_tables()
        print("[INIT_DB] Schema init completed (idempotent)")
    finally:
        await database.dispose()


def main() -> None:
    asyncio.run(run_init())


if __name__ == "__main__":
    main()
