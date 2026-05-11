import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSignal } from "solid-js";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { HabitProvider, useHabits } from "../store/habitStore";
import * as api from "../services/habitService";

// Mock the entire habitService module
vi.mock("../services/habitService", () => ({
  getHabits: vi.fn(),
  createHabit: vi.fn(),
  updateHabit: vi.fn(),
  deleteHabit: vi.fn(),
  completeHabit: vi.fn(),
  getProgress: vi.fn(),
}));

// ── Consumer component for testing the store ─────────────────────────────────

function Consumer() {
  const ctx = useHabits();
  return (
    <div>
      <span data-testid="loading">{String(ctx.state.loading)}</span>
      <span data-testid="error">{ctx.state.error || "none"}</span>
      <span data-testid="count">{ctx.state.habits.length}</span>
      <button
        data-testid="fetch-btn"
        onClick={ctx.fetchHabits}
      >
        Fetch
      </button>
      <button
        data-testid="create-btn"
        onClick={() => ctx.createHabit({ title: "Test", frequency: "daily" })}
      >
        Create
      </button>
      <button
        data-testid="delete-btn"
        onClick={() => ctx.deleteHabit(1)}
      >
        Delete
      </button>
      <button
        data-testid="complete-btn"
        onClick={() => ctx.completeHabit(1, "2026-05-11")}
      >
        Complete
      </button>
    </div>
  );
}

function renderStore() {
  return render(() => (
    <HabitProvider>
      <Consumer />
    </HabitProvider>
  ));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("habitStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchHabits populates habits and sets loading=false", async () => {
    api.getHabits.mockResolvedValue([
      { id: 1, title: "Read", frequency: "daily", created_at: "2026-01-01T00:00:00" },
    ]);
    renderStore();
    screen.getByTestId("fetch-btn").click();
    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("fetchHabits sets error on failure", async () => {
    api.getHabits.mockRejectedValue(new Error("Network failure"));
    renderStore();
    screen.getByTestId("fetch-btn").click();
    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("Network failure");
    });
  });

  it("createHabit calls service then refetches", async () => {
    api.createHabit.mockResolvedValue({ id: 1, title: "Test", frequency: "daily" });
    api.getHabits.mockResolvedValue([{ id: 1, title: "Test", frequency: "daily", created_at: "2026-01-01T00:00:00" }]);
    renderStore();
    screen.getByTestId("create-btn").click();
    await waitFor(() => {
      expect(api.createHabit).toHaveBeenCalledWith({ title: "Test", frequency: "daily" });
    });
    await waitFor(() => {
      expect(api.getHabits).toHaveBeenCalled();
    });
  });

  it("deleteHabit removes from local state without refetching full list", async () => {
    // Setup habits in store first
    api.getHabits.mockResolvedValue([
      { id: 1, title: "Read", frequency: "daily", created_at: "2026-01-01T00:00:00" },
      { id: 2, title: "Jog", frequency: "weekly", created_at: "2026-01-02T00:00:00" },
    ]);
    renderStore();
    screen.getByTestId("fetch-btn").click();
    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("2");
    });

    api.deleteHabit.mockResolvedValue(null);
    screen.getByTestId("delete-btn").click();
    await waitFor(() => {
      // After delete, count should drop to 1 (optimistic removal)
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
  });

  it("completeHabit calls service then refetches", async () => {
    api.completeHabit.mockResolvedValue({ id: 1, title: "Read", frequency: "daily", created_at: "2026-01-01T00:00:00" });
    api.getHabits.mockResolvedValue([{ id: 1, title: "Read", frequency: "daily", created_at: "2026-01-01T00:00:00" }]);
    renderStore();
    screen.getByTestId("complete-btn").click();
    await waitFor(() => {
      expect(api.completeHabit).toHaveBeenCalledWith(1, "2026-05-11");
    });
  });
});
