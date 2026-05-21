from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class EstimateSession(Base):
    __tablename__ = "estimate_sessions"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    session_json: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
