"""Integration tests for all /api/v1 endpoints using TestClient."""

import pytest
from datetime import date
from freezegun import freeze_time


# ── Helpers ────────────────────────────────────────────────────────────────────

def _create_habit(client, title="Read", frequency="daily"):
    """Convenience: create a habit and return the parsed JSON."""
    res = client.post("/api/v1/habits", json={"title": title, "frequency": frequency})
    assert res.status_code == 201, res.text
    return res.json()


# ═══════════════════════════════════════════════════════════════════════════════
# POST /habits  (create)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateHabit:
    def test_create_daily(self, client):
        res = client.post("/api/v1/habits", json={"title": "Read", "frequency": "daily"})
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Read"
        assert data["frequency"] == "daily"
        assert data["id"] == 1
        assert "created_at" in data

    def test_create_weekly(self, client):
        res = client.post("/api/v1/habits", json={"title": "Gym", "frequency": "weekly"})
        assert res.status_code == 201
        assert res.json()["frequency"] == "weekly"

    def test_default_frequency_is_daily(self, client):
        """When frequency is omitted, Pydantic default 'daily' kicks in."""
        res = client.post("/api/v1/habits", json={"title": "Sleep"})
        assert res.status_code == 201
        assert res.json()["frequency"] == "daily"

    def test_missing_title_returns_422(self, client):
        res = client.post("/api/v1/habits", json={"frequency": "daily"})
        assert res.status_code == 422

    def test_invalid_frequency_returns_422(self, client):
        res = client.post("/api/v1/habits", json={"title": "X", "frequency": "monthly"})
        assert res.status_code == 422

    def test_empty_body_returns_422(self, client):
        res = client.post("/api/v1/habits", json={})
        assert res.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# GET /habits  (list)
# ═══════════════════════════════════════════════════════════════════════════════

class TestListHabits:
    def test_empty_list(self, client):
        res = client.get("/api/v1/habits")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_returns_all(self, client):
        _create_habit(client, "A")
        _create_habit(client, "B")
        res = client.get("/api/v1/habits")
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_list_ordered_newest_first(self, client):
        _create_habit(client, "Old")
        _create_habit(client, "New")
        data = client.get("/api/v1/habits").json()
        assert data[0]["title"] == "New"
        assert data[1]["title"] == "Old"


# ═══════════════════════════════════════════════════════════════════════════════
# PUT /habits/{id}  (update)
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateHabit:
    def test_update_title(self, client):
        h = _create_habit(client, "Old title")
        res = client.put(f"/api/v1/habits/{h['id']}", json={"title": "New title"})
        assert res.status_code == 200
        assert res.json()["title"] == "New title"
        assert res.json()["frequency"] == h["frequency"]  # unchanged

    def test_update_frequency(self, client):
        h = _create_habit(client, "X", frequency="daily")
        res = client.put(f"/api/v1/habits/{h['id']}", json={"frequency": "weekly"})
        assert res.status_code == 200
        assert res.json()["frequency"] == "weekly"

    def test_update_both_fields(self, client):
        h = _create_habit(client, "X", frequency="daily")
        res = client.put(
            f"/api/v1/habits/{h['id']}",
            json={"title": "Y", "frequency": "weekly"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Y"
        assert data["frequency"] == "weekly"

    def test_update_nonexistent_returns_404(self, client):
        res = client.put("/api/v1/habits/999", json={"title": "Ghost"})
        assert res.status_code == 404

    def test_update_empty_body_is_ok(self, client):
        """Sending no fields should succeed (no-op)."""
        h = _create_habit(client, "Keep")
        res = client.put(f"/api/v1/habits/{h['id']}", json={})
        assert res.status_code == 200
        assert res.json()["title"] == "Keep"

    def test_invalid_frequency_returns_422(self, client):
        h = _create_habit(client, "X")
        res = client.put(f"/api/v1/habits/{h['id']}", json={"frequency": "yearly"})
        assert res.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# DELETE /habits/{id}
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeleteHabit:
    def test_delete_success(self, client):
        h = _create_habit(client, "Delete me")
        res = client.delete(f"/api/v1/habits/{h['id']}")
        assert res.status_code == 204
        # Verify it's gone
        assert client.get("/api/v1/habits").json() == []

    def test_delete_nonexistent_returns_404(self, client):
        res = client.delete("/api/v1/habits/999")
        assert res.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# POST /habits/{id}/complete
# ═══════════════════════════════════════════════════════════════════════════════

class TestCompleteHabit:
    def test_complete_with_explicit_date(self, client):
        h = _create_habit(client, "Read")
        res = client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-10")
        assert res.status_code == 200
        # Returns the habit (HabitOut)
        assert res.json()["id"] == h["id"]

    @freeze_time("2026-05-11")
    def test_complete_without_date_defaults_today(self, client):
        h = _create_habit(client, "Read")
        res = client.post(f"/api/v1/habits/{h['id']}/complete")
        assert res.status_code == 200

    @freeze_time("2026-05-11")
    def test_complete_is_idempotent(self, client):
        h = _create_habit(client, "Read")
        r1 = client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-11")
        r2 = client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-11")
        assert r1.status_code == 200
        assert r2.status_code == 200

    def test_complete_nonexistent_habit_returns_404(self, client):
        res = client.post("/api/v1/habits/999/complete?date=2026-05-11")
        assert res.status_code == 404

    def test_complete_invalid_date_format_returns_422(self, client):
        h = _create_habit(client, "Read")
        res = client.post(f"/api/v1/habits/{h['id']}/complete?date=05-11-2026")
        assert res.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# GET /habits/{id}/progress
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetProgress:
    def test_progress_nonexistent_habit_returns_404(self, client):
        res = client.get("/api/v1/habits/999/progress")
        assert res.status_code == 404

    @freeze_time("2026-05-11")
    def test_daily_progress_structure(self, client):
        """Smoke test: progress endpoint returns correct schema shape."""
        h = _create_habit(client, "Read", frequency="daily")
        # Complete today
        client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-11")
        res = client.get(f"/api/v1/habits/{h['id']}/progress")
        assert res.status_code == 200
        data = res.json()
        assert data["habit_id"] == h["id"]
        assert data["frequency"] == "daily"
        assert isinstance(data["completions"], list)
        assert isinstance(data["streak"], int)

    @freeze_time("2026-05-11")
    def test_weekly_progress_structure(self, client):
        """Smoke test: weekly progress returns correct shape."""
        h = _create_habit(client, "Gym", frequency="weekly")
        client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-11")
        res = client.get(f"/api/v1/habits/{h['id']}/progress")
        assert res.status_code == 200
        data = res.json()
        assert data["frequency"] == "weekly"

    @freeze_time("2026-05-11")
    def test_progress_dates_are_iso_format(self, client):
        """Completions list contains ISO-format dates (YYYY-MM-DD)."""
        h = _create_habit(client, "Read", frequency="daily")
        client.post(f"/api/v1/habits/{h['id']}/complete?date=2026-05-11")
        data = client.get(f"/api/v1/habits/{h['id']}/progress").json()
        for d in data["completions"]:
            # Must be a string in YYYY-MM-DD format
            assert isinstance(d, str)
            assert len(d) == 10
            assert d[4] == "-" and d[7] == "-"
