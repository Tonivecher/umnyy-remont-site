#!/usr/bin/env python3
import asyncio
import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from db import Database, EstimateSessionRepository


async def run_check() -> None:
    database = Database()
    repository = EstimateSessionRepository(database)
    try:
        await database.create_tables()

        payload = json.dumps({"status": "dummy"}, ensure_ascii=False)
        await repository.upsert_session(user_id=1, session_json=payload)
        saved_session = await repository.get_session(user_id=1)

        if not saved_session:
            raise RuntimeError("Dummy session was not found after upsert.")
        if saved_session.session_json != payload:
            raise RuntimeError("Dummy session payload mismatch.")
    finally:
        await database.dispose()

    print("OK")


def main() -> None:
    asyncio.run(run_check())


if __name__ == "__main__":
    main()
