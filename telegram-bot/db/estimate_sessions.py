from datetime import datetime, timezone

from db.database import Database, get_default_database
from db.models import EstimateSession


class EstimateSessionRepository:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_default_database()

    async def upsert_session(self, user_id: int, session_json: str) -> None:
        record = EstimateSession(
            user_id=user_id,
            session_json=session_json,
            updated_at=datetime.now(timezone.utc),
        )
        async with self._database.session() as session:
            await session.merge(record)
            await session.commit()

    async def get_session(self, user_id: int) -> EstimateSession | None:
        async with self._database.session() as session:
            return await session.get(EstimateSession, user_id)

    async def delete_session(self, user_id: int) -> None:
        async with self._database.session() as session:
            record = await session.get(EstimateSession, user_id)
            if record is not None:
                await session.delete(record)
            await session.commit()
