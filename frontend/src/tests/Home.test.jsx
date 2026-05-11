import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import { HabitProvider } from "../store/habitStore";
import Home from "../pages/Home";

vi.mock("../services/habitService", () => ({
  getHabits: vi.fn().mockResolvedValue([]),
  createHabit: vi.fn().mockResolvedValue({}),
  completeHabit: vi.fn().mockResolvedValue({}),
  deleteHabit: vi.fn().mockResolvedValue(null),
}));

describe("Home", () => {
  it('renders the dashboard header', () => {
    const { getByText } = render(() => (
      <HabitProvider>
        <Home />
      </HabitProvider>
    ));
    expect(getByText("Habit Tracker")).toBeInTheDocument();
  });

  it('shows empty message when no habits', async () => {
    render(() => (
      <HabitProvider>
        <Home />
      </HabitProvider>
    ));
    // After resource resolves, empty message appears
    const emptyMsg = await screen.findByText(/Nenhum hábito cadastrado/);
    expect(emptyMsg).toBeInTheDocument();
  });

  it('renders HabitForm in sidebar', () => {
    render(() => (
      <HabitProvider>
        <Home />
      </HabitProvider>
    ));
    expect(screen.getByText("Novo hábito")).toBeInTheDocument();
  });
});
