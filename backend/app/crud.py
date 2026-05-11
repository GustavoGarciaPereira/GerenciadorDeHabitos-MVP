"""CRUD functions for habits and completions — all synchronous with an injected session."""

from datetime import date, timedelta
from typing import List, Optional, Set, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas


# ── Helpers ────────────────────────────────────────────────────────────────────

def _monday_of_iso_week(d: date) -> date:
    """Return the Monday date of the ISO week containing `d`."""
    return d - timedelta(days=d.isoweekday() - 1)


def _iso_week_key(d: date) -> Tuple[int, int]:
    """Return (ISO year, ISO week number) for a date."""
    iso = d.isocalendar()
    return (iso[0], iso[1])


# ── Habits CRUD ────────────────────────────────────────────────────────────────

def get_habits(db: Session) -> List[models.Habit]:
    """Return all habits ordered by creation date (newest first)."""
    return db.query(models.Habit).order_by(models.Habit.created_at.desc()).all()


def get_habit(db: Session, habit_id: int) -> Optional[models.Habit]:
    """Return a single habit by id, or None if not found."""
    return db.query(models.Habit).filter(models.Habit.id == habit_id).first()


def create_habit(db: Session, data: schemas.HabitCreate) -> models.Habit:
    """Create and persist a new habit from a HabitCreate schema."""
    habit = models.Habit(title=data.title, frequency=data.frequency)
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def update_habit(db: Session, habit_id: int, data: schemas.HabitUpdate) -> Optional[models.Habit]:
    """Update fields of an existing habit. Only non-None values are applied."""
    habit = get_habit(db, habit_id)
    if habit is None:
        return None
    if data.title is not None:
        habit.title = data.title
    if data.frequency is not None:
        habit.frequency = data.frequency
    db.commit()
    db.refresh(habit)
    return habit


def delete_habit(db: Session, habit_id: int) -> bool:
    """Delete a habit by id. Returns True if deleted, False if not found."""
    habit = get_habit(db, habit_id)
    if habit is None:
        return False
    db.delete(habit)
    db.commit()
    return True


# ── Completions ────────────────────────────────────────────────────────────────

def complete_habit(db: Session, habit_id: int, completion_date: date) -> Optional[models.HabitCompletion]:
    """Mark a habit as completed on `completion_date`.

    Idempotent: if a completion already exists for (habit_id, date) it is returned
    unchanged. Returns None only when the habit does not exist.
    """
    habit = get_habit(db, habit_id)
    if habit is None:
        return None

    existing = (
        db.query(models.HabitCompletion)
        .filter(
            models.HabitCompletion.habit_id == habit_id,
            models.HabitCompletion.date == completion_date,
        )
        .first()
    )
    if existing is not None:
        return existing

    completion = models.HabitCompletion(habit_id=habit_id, date=completion_date)
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion


# ── Progress ───────────────────────────────────────────────────────────────────

def get_habit_progress(db: Session, habit_id: int) -> Optional[schemas.HabitProgressOut]:
    """Build the progress snapshot for a habit (last 7 units + streak).

    - daily: last 7 calendar days; streak counts consecutive days ending today.
    - weekly: last 7 ISO weeks; each week is represented by its Monday date.
      Streak counts consecutive weeks (with ≥1 completion) ending at the current week.
    """
    habit = get_habit(db, habit_id)
    if habit is None:
        return None

    completions_q = (
        db.query(models.HabitCompletion.date)
        .filter(models.HabitCompletion.habit_id == habit_id)
    )

    if habit.frequency == "daily":
        return _daily_progress(habit, completions_q)
    else:
        return _weekly_progress(habit, completions_q)


def _daily_progress(
    habit: models.Habit,
    completions_q,
) -> schemas.HabitProgressOut:
    """Compute daily progress: last 7 days + consecutive-day streak."""
    today = date.today()
    window_start = today - timedelta(days=6)

    rows = (
        completions_q
        .filter(models.HabitCompletion.date >= window_start)
        .order_by(models.HabitCompletion.date.desc())
        .all()
    )
    # rows are list of (date,) tuples
    completion_dates = [row[0] for row in rows]

    # Streak: count consecutive days backwards from today
    all_completions = set(
        row[0] for row in completions_q.all()
    )
    streak = 0
    cursor = today
    while cursor in all_completions:
        streak += 1
        cursor -= timedelta(days=1)

    return schemas.HabitProgressOut(
        habit_id=habit.id,
        frequency=habit.frequency,
        completions=sorted(completion_dates),
        streak=streak,
    )


def _weekly_progress(
    habit: models.Habit,
    completions_q,
) -> schemas.HabitProgressOut:
    """Compute weekly progress: last 7 ISO weeks + consecutive-week streak."""
    today = date.today()
    current_monday = _monday_of_iso_week(today)

    # All completion dates
    all_dates: List[date] = [row[0] for row in completions_q.all()]

    # Group completions by ISO week → set of Monday dates that have ≥1 completion
    completed_mondays: Set[date] = set()
    for d in all_dates:
        completed_mondays.add(_monday_of_iso_week(d))

    # Last 7 Mondays (current week + 6 previous)
    last_7_mondays = [current_monday - timedelta(weeks=i) for i in range(7)]

    # Completions list = those Mondays that have completions
    completion_mondays = sorted([m for m in last_7_mondays if m in completed_mondays])

    # Streak: count consecutive weeks backwards from current week
    streak = 0
    cursor_monday = current_monday
    while cursor_monday in completed_mondays:
        streak += 1
        cursor_monday -= timedelta(weeks=1)

    return schemas.HabitProgressOut(
        habit_id=habit.id,
        frequency=habit.frequency,
        completions=completion_mondays,
        streak=streak,
    )
