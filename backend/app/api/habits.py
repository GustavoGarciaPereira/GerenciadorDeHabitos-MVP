"""API routes for habits — all under /api/v1."""

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/v1")


# ── Habit CRUD ─────────────────────────────────────────────────────────────────

@router.post("/habits", response_model=schemas.HabitOut, status_code=201)
def create_habit(payload: schemas.HabitCreate, db: Session = Depends(get_db)):
    """Create a new habit."""
    return crud.create_habit(db, payload)


@router.get("/habits", response_model=List[schemas.HabitOut])
def list_habits(db: Session = Depends(get_db)):
    """List all habits (newest first)."""
    return crud.get_habits(db)


@router.put("/habits/{habit_id}", response_model=schemas.HabitOut)
def update_habit(habit_id: int, payload: schemas.HabitUpdate, db: Session = Depends(get_db)):
    """Update title and/or frequency of an existing habit."""
    habit = crud.update_habit(db, habit_id, payload)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


@router.delete("/habits/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    """Delete a habit and its completions."""
    deleted = crud.delete_habit(db, habit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Habit not found")


# ── Completion ─────────────────────────────────────────────────────────────────

@router.post(
    "/habits/{habit_id}/complete",
    response_model=schemas.HabitOut,
)
def complete_habit(
    habit_id: int,
    completion_date: date = Query(default_factory=date.today, alias="date"),
    db: Session = Depends(get_db),
):
    """Mark a habit as completed on `date` (defaults to today).

    Idempotent: calling twice with the same date returns the habit unchanged.
    """
    result = crud.complete_habit(db, habit_id, completion_date)
    if result is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    # Return the parent habit so the frontend can update its state
    return crud.get_habit(db, habit_id)


# ── Progress ───────────────────────────────────────────────────────────────────

@router.get(
    "/habits/{habit_id}/progress",
    response_model=schemas.HabitProgressOut,
)
def get_progress(habit_id: int, db: Session = Depends(get_db)):
    """Return the 7-day/week grid of completions plus the current streak."""
    progress = crud.get_habit_progress(db, habit_id)
    if progress is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return progress
