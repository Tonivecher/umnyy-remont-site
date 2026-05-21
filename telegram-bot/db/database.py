from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from db.config import get_database_url, get_sqlite_path
from db.models import Base


def _resolve_sqlite_url(sqlite_path: Path) -> str:
    sqlite_path = sqlite_path.expanduser()
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{sqlite_path.resolve()}"


def _normalize_database_url(raw_url: str) -> str:
    normalized_url = raw_url
    if raw_url.startswith("postgres://"):
        normalized_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql://"):
        normalized_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql+psycopg://"):
        normalized_url = raw_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("sqlite:///"):
        normalized_url = raw_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    if normalized_url.startswith("postgresql+asyncpg://"):
        parsed = urlsplit(normalized_url)
        query_pairs = parse_qsl(parsed.query, keep_blank_values=True)

        rewritten_pairs: list[tuple[str, str]] = []
        sslmode_value: str | None = None
        has_ssl = False
        for key, value in query_pairs:
            if key == "sslmode":
                sslmode_value = value
                continue
            if key == "ssl":
                has_ssl = True
            rewritten_pairs.append((key, value))

        if sslmode_value and not has_ssl:
            ssl_value = "false" if sslmode_value.lower() == "disable" else "true"
            rewritten_pairs.append(("ssl", ssl_value))

        normalized_url = urlunsplit(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                urlencode(rewritten_pairs),
                parsed.fragment,
            )
        )

    return normalized_url


def resolve_engine_url(
    database_url: str | None = None,
    sqlite_path: Path | None = None,
) -> str:
    effective_database_url = database_url if database_url is not None else get_database_url()
    if effective_database_url:
        return _normalize_database_url(effective_database_url)

    effective_sqlite_path = sqlite_path if sqlite_path is not None else get_sqlite_path()
    return _resolve_sqlite_url(effective_sqlite_path)


class Database:
    def __init__(
        self,
        database_url: str | None = None,
        sqlite_path: Path | None = None,
    ) -> None:
        effective_database_url = database_url if database_url is not None else get_database_url()
        effective_sqlite_path = sqlite_path if sqlite_path is not None else get_sqlite_path()

        self._uses_database_url = bool(effective_database_url)
        self._sqlite_path = effective_sqlite_path.expanduser().resolve()

        self.engine_url = resolve_engine_url(
            database_url=effective_database_url,
            sqlite_path=effective_sqlite_path,
        )
        self.engine: AsyncEngine = create_async_engine(
            self.engine_url,
            pool_pre_ping=True,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
        )

    @property
    def backend_name(self) -> str:
        return self.engine.dialect.name

    @property
    def uses_database_url(self) -> bool:
        return self._uses_database_url

    @property
    def sqlite_path(self) -> Path:
        return self._sqlite_path

    def startup_log_line(self) -> str:
        if self.backend_name == "postgresql":
            return "[STARTUP][DB] backend=Postgres source=DATABASE_URL"
        if self.backend_name == "sqlite":
            return f"[STARTUP][DB] backend=SQLite source=SQLITE_PATH path={self.sqlite_path}"
        source = "DATABASE_URL" if self.uses_database_url else "SQLITE_PATH"
        return f"[STARTUP][DB] backend={self.backend_name} source={source}"

    async def create_tables(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            yield session

    async def dispose(self) -> None:
        await self.engine.dispose()


_default_database: Database | None = None


def get_default_database() -> Database:
    global _default_database
    if _default_database is None:
        _default_database = Database()
    return _default_database
