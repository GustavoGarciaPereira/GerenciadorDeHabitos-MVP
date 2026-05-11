"""Pydantic schemas for request/response validation."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Habit ──────────────────────────────────────────────────────────────────────

class HabitCreate(BaseModel):
    """Schema for creating a new habit."""
    title: str
    frequency: str = Field(default="daily", pattern=r"^(daily|weekly)$")


class HabitUpdate(BaseModel):
    """Schema for updating an existing habit. All fields optional."""
    title: Optional[str] = None
    frequency: Optional[str] = Field(default=None, pattern=r"^(daily|weekly)$")


class HabitOut(BaseModel):
    """Schema returned when reading a habit."""
    id: int
    title: str
    frequency: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Progress ───────────────────────────────────────────────────────────────────

class HabitProgressOut(BaseModel):
    """Schema for habit progress (completions grid + streak)."""
    habit_id: int
    frequency: str
    completions: List[date]
    streak: int
