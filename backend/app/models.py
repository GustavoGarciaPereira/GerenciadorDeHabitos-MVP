"""SQLAlchemy ORM models for Habit and HabitCompletion."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


class Habit(Base):
    """A habit tracked by the user — daily or weekly frequency."""

    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    frequency = Column(String, nullable=False, default="daily")  # "daily" or "weekly"
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    completions = relationship("HabitCompletion", back_populates="habit", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Habit id={self.id} title={self.title!r} freq={self.frequency}>"


class HabitCompletion(Base):
    """Records a single completion event — one date per habit (unique constraint)."""

    __tablename__ = "habit_completions"
    __table_args__ = (
        UniqueConstraint("habit_id", "date", name="uq_habit_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)

    habit = relationship("Habit", back_populates="completions")

    def __repr__(self) -> str:
        return f"<HabitCompletion habit_id={self.habit_id} date={self.date}>"
