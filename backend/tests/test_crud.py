"""Unit tests for crud.py — every function, edge cases, and progress logic."""

import pytest
from datetime import date, timedelta

from freezegun import freeze_time

from app import crud, models, schemas


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _make_habit(db, title="Test", frequency="daily"):
    """Create a habit and return it."""
    return crud.create_habit(db, schemas.HabitCreate(title=title, frequency=frequency))


def _complete(db, habit_id, completion_date):
    """Shortcut to complete a habit on a given date."""
    crud.complete_habit(db, habit_id, completion_date)


# ═══════════════════════════════════════════════════════════════════════════════
# get_habits
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_habits_empty(db):
    """Empty database returns an empty list."""
    assert crud.get_habits(db) == []


def test_get_habits_multiple(db):
    """Returns all habits ordered by created_at descending (newest first)."""
    h1 = _make_habit(db, "First")
    h2 = _make_habit(db, "Second")
    habits = crud.get_habits(db)
    assert len(habits) == 2
    # Second habit was created later, so it should appear first.
    assert habits[0].title == "Second"
    assert habits[1].title == "First"


# ═══════════════════════════════════════════════════════════════════════════════
# get_habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_habit_found(db):
    h = _make_habit(db)
    fetched = crud.get_habit(db, h.id)
    assert fetched is not None
    assert fetched.id == h.id


def test_get_habit_not_found(db):
    assert crud.get_habit(db, 999) is None


# ═══════════════════════════════════════════════════════════════════════════════
# create_habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_create_habit_daily(db):
    h = crud.create_habit(db, schemas.HabitCreate(title="Read", frequency="daily"))
    assert h.id is not None
    assert h.title == "Read"
    assert h.frequency == "daily"
    assert h.created_at is not None


def test_create_habit_weekly(db):
    h = crud.create_habit(db, schemas.HabitCreate(title="Jog", frequency="weekly"))
    assert h.frequency == "weekly"


def test_create_habit_default_frequency(db):
    """When frequency is omitted, it defaults to 'daily'."""
    h = crud.create_habit(db, schemas.HabitCreate(title="Default"))
    assert h.frequency == "daily"


# ═══════════════════════════════════════════════════════════════════════════════
# update_habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_update_title_only(db):
    h = _make_habit(db, "Old", "daily")
    updated = crud.update_habit(db, h.id, schemas.HabitUpdate(title="New"))
    assert updated.title == "New"
    assert updated.frequency == "daily"  # unchanged


def test_update_frequency_only(db):
    h = _make_habit(db, "Read", "daily")
    updated = crud.update_habit(db, h.id, schemas.HabitUpdate(frequency="weekly"))
    assert updated.title == "Read"
    assert updated.frequency == "weekly"


def test_update_both(db):
    h = _make_habit(db, "Old", "daily")
    updated = crud.update_habit(db, h.id, schemas.HabitUpdate(title="New", frequency="weekly"))
    assert updated.title == "New"
    assert updated.frequency == "weekly"


def test_update_nonexistent(db):
    assert crud.update_habit(db, 999, schemas.HabitUpdate(title="Nope")) is None


# ═══════════════════════════════════════════════════════════════════════════════
# delete_habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_delete_success(db):
    h = _make_habit(db)
    assert crud.delete_habit(db, h.id) is True
    assert crud.get_habit(db, h.id) is None


def test_delete_nonexistent(db):
    assert crud.delete_habit(db, 999) is False


# ═══════════════════════════════════════════════════════════════════════════════
# complete_habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_complete_creates_record(db):
    h = _make_habit(db)
    d = date(2026, 5, 11)
    comp = crud.complete_habit(db, h.id, d)
    assert comp is not None
    assert comp.habit_id == h.id
    assert comp.date == d


def test_complete_idempotent(db):
    h = _make_habit(db)
    d = date(2026, 5, 11)
    first = crud.complete_habit(db, h.id, d)
    second = crud.complete_habit(db, h.id, d)
    assert first.id == second.id
    # Only one row in the database
    from app.models import HabitCompletion
    count = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == h.id,
        HabitCompletion.date == d,
    ).count()
    assert count == 1


def test_complete_nonexistent_habit(db):
    assert crud.complete_habit(db, 999, date(2026, 5, 11)) is None


# ═══════════════════════════════════════════════════════════════════════════════
# get_habit_progress — non-existent habit
# ═══════════════════════════════════════════════════════════════════════════════

def test_progress_nonexistent_habit(db):
    assert crud.get_habit_progress(db, 999) is None


# ═══════════════════════════════════════════════════════════════════════════════
# get_habit_progress — daily
# ═══════════════════════════════════════════════════════════════════════════════

TODAY = date(2026, 5, 11)  # Monday


@freeze_time("2026-05-11")
def test_daily_no_completions(db):
    h = _make_habit(db, "Read", "daily")
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 0
    assert p.completions == []


@freeze_time("2026-05-11")
def test_daily_completion_today(db):
    h = _make_habit(db, "Read", "daily")
    _complete(db, h.id, TODAY)
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 1
    assert TODAY in p.completions


@freeze_time("2026-05-11")
def test_daily_streak_two_days(db):
    h = _make_habit(db, "Read", "daily")
    _complete(db, h.id, TODAY)                 # 05-11
    _complete(db, h.id, TODAY - timedelta(days=1))  # 05-10
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 2
    assert len(p.completions) == 2


@freeze_time("2026-05-11")
def test_daily_yesterday_not_today(db):
    """Completion yesterday but not today → streak 0."""
    h = _make_habit(db, "Read", "daily")
    _complete(db, h.id, TODAY - timedelta(days=1))  # 05-10
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 0
    assert TODAY not in p.completions
    assert (TODAY - timedelta(days=1)) in p.completions


@freeze_time("2026-05-11")
def test_daily_alternating_days_streak_breaks(db):
    """Completions on 05-09, 05-11 but NOT 05-10 → streak is 1 (only today)."""
    h = _make_habit(db, "Read", "daily")
    _complete(db, h.id, TODAY)                      # 05-11
    _complete(db, h.id, TODAY - timedelta(days=2))  # 05-09
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 1  # gap at 05-10 breaks it
    # Both dates still appear in completions (they are within last 7 days)
    assert len(p.completions) == 2


@freeze_time("2026-05-11")
def test_daily_old_completion_not_in_grid(db):
    """Completion 8 days ago should not appear in completions list."""
    h = _make_habit(db, "Read", "daily")
    old_date = TODAY - timedelta(days=8)  # 05-03 (outside 7-day window)
    _complete(db, h.id, old_date)
    p = crud.get_habit_progress(db, h.id)
    assert len(p.completions) == 0  # outside 7-day window
    assert p.streak == 0            # no completion today


@freeze_time("2026-05-11")
def test_daily_long_streak_grid_capped(db):
    """10-day streak → streak=10, but completions only shows last 7 days."""
    h = _make_habit(db, "Read", "daily")
    for day_offset in range(10):  # 05-02 through 05-11
        _complete(db, h.id, TODAY - timedelta(days=day_offset))
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 10         # entire streak counted
    assert len(p.completions) == 7  # grid capped at 7 days


# ═══════════════════════════════════════════════════════════════════════════════
# get_habit_progress — weekly
# ═══════════════════════════════════════════════════════════════════════════════

# 2026-05-11 is a Monday. ISO week starts on Monday.
# The current ISO week's Monday is 2026-05-11.

MON = date(2026, 5, 11)
PREV_MON = MON - timedelta(weeks=1)   # 2026-05-04
PREV2_MON = MON - timedelta(weeks=2)  # 2026-04-27
PREV3_MON = MON - timedelta(weeks=3)  # 2026-04-20


@freeze_time("2026-05-11")
def test_weekly_no_completions(db):
    h = _make_habit(db, "Jog", "weekly")
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 0
    assert p.completions == []


@freeze_time("2026-05-11")
def test_weekly_one_completion_this_week(db):
    h = _make_habit(db, "Jog", "weekly")
    _complete(db, h.id, MON + timedelta(days=2))  # Wednesday, same ISO week
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 1
    assert MON in p.completions  # Monday date of the week


@freeze_time("2026-05-11")
def test_weekly_two_consecutive_weeks(db):
    h = _make_habit(db, "Jog", "weekly")
    _complete(db, h.id, MON)        # this week
    _complete(db, h.id, PREV_MON)   # last week
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 2
    assert MON in p.completions
    assert PREV_MON in p.completions


@freeze_time("2026-05-11")
def test_weekly_gap_breaks_streak(db):
    """Completion this week, gap, then 2 weeks ago → streak = 1."""
    h = _make_habit(db, "Jog", "weekly")
    _complete(db, h.id, MON)         # this week
    _complete(db, h.id, PREV2_MON)   # 2 weeks ago (gap at PREV_MON)
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 1  # gap at previous week breaks it
    # Both weeks still in completions
    assert MON in p.completions
    assert PREV2_MON in p.completions


@freeze_time("2026-05-11")
def test_weekly_multiple_completions_same_week(db):
    """Multiple completions in the same ISO week → only one Monday in completions."""
    h = _make_habit(db, "Jog", "weekly")
    _complete(db, h.id, MON)                   # Monday
    _complete(db, h.id, MON + timedelta(days=3))  # Thursday, same week
    _complete(db, h.id, MON + timedelta(days=6))  # Sunday, same week
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 1
    assert len(p.completions) == 1
    assert MON in p.completions


@freeze_time("2026-05-11")
def test_weekly_grid_max_7_weeks(db):
    """Completions in 9 consecutive weeks → streak=9, but completions capped at 7."""
    h = _make_habit(db, "Jog", "weekly")
    for week_offset in range(9):
        d = MON - timedelta(weeks=week_offset)
        _complete(db, h.id, d)
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 9
    assert len(p.completions) == 7


@freeze_time("2026-05-11")
def test_weekly_no_completion_this_week_streak_zero(db):
    """If current week has no completions, streak is 0 even if last week does."""
    h = _make_habit(db, "Jog", "weekly")
    _complete(db, h.id, PREV_MON)  # last week
    p = crud.get_habit_progress(db, h.id)
    assert p.streak == 0


# ═══════════════════════════════════════════════════════════════════════════════
# ISO year boundary (regression test)
# ═══════════════════════════════════════════════════════════════════════════════

@freeze_time("2026-01-05")  # Monday
def test_weekly_across_iso_year_boundary(db):
    """Completions across the ISO year boundary: week 52 of 2025 + week 1 of 2026.
    Also include the current week so streak counts through the boundary."""
    h = _make_habit(db, "Jog", "weekly")
    # 2025-12-23 (Tue) → Monday 2025-12-22 (ISO week 52 of 2025)
    # 2025-12-30 (Tue) → Monday 2025-12-29 (ISO week 1 of 2026)
    # 2026-01-05 (Mon, today) → Monday 2026-01-05 (ISO week 2 of 2026)
    _complete(db, h.id, date(2025, 12, 23))  # week 52 of 2025
    _complete(db, h.id, date(2025, 12, 30))  # week 1 of 2026
    _complete(db, h.id, date(2026, 1, 5))    # current week
    p = crud.get_habit_progress(db, h.id)
    # Streak across the boundary: weeks 2026-01-05, 2025-12-29, 2025-12-22 = 3
    assert p.streak == 3
    assert len(p.completions) == 3


# ═══════════════════════════════════════════════════════════════════════════════
# _monday_of_iso_week
# ═══════════════════════════════════════════════════════════════════════════════

def test_monday_of_iso_week_monday():
    """A Monday already returns itself."""
    m = date(2026, 5, 11)  # Monday
    assert crud._monday_of_iso_week(m) == m


def test_monday_of_iso_week_wednesday():
    """Wednesday returns the Monday of that week."""
    assert crud._monday_of_iso_week(date(2026, 5, 13)) == date(2026, 5, 11)


def test_monday_of_iso_week_sunday():
    """Sunday returns the Monday of that same ISO week."""
    assert crud._monday_of_iso_week(date(2026, 5, 17)) == date(2026, 5, 11)


# ═══════════════════════════════════════════════════════════════════════════════
# _iso_week_key
# ═══════════════════════════════════════════════════════════════════════════════

def test_iso_week_key():
    assert crud._iso_week_key(date(2026, 5, 11)) == (2026, 20)


def test_iso_week_key_year_boundary():
    """2025-12-29 is Monday of ISO week 1 of 2026."""
    assert crud._iso_week_key(date(2025, 12, 29)) == (2026, 1)
