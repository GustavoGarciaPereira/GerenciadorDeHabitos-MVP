import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import * as api from "../services/habitService";

// ── Context ──────────────────────────────────────────────────────────────────

const HabitContext = createContext();

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabits must be used within <HabitProvider>");
  return ctx;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function HabitProvider(props) {
  const [state, setState] = createStore({
    habits: [],
    loading: false,
    error: null,
    // Mission 2 additions
    selectedHabitId: null,
    progress: {},        // { [habitId]: HabitProgressOut }
    optimisticCompletions: [],  // habit IDs optimistically completed today
  });

  // ── Habit list ──────────────────────────────────────────────────────────

  /** Fetch habits from the backend and replace local state. */
  async function fetchHabits() {
    setState({ loading: true, error: null });
    try {
      const data = await api.getHabits();
      setState({ habits: data, loading: false });
    } catch (err) {
      setState({ error: err.message, loading: false });
    }
  }

  /** Create a habit, then refresh the list. */
  async function createHabit(data) {
    setState({ error: null });
    try {
      await api.createHabit(data);
      await fetchHabits();
    } catch (err) {
      setState({ error: err.message });
    }
  }

  /** Update a habit, then refresh the list. */
  async function updateHabit(id, data) {
    setState({ error: null });
    try {
      await api.updateHabit(id, data);
      await fetchHabits();
    } catch (err) {
      setState({ error: err.message });
    }
  }

  /** Delete a habit — optimistic removal from the local list. */
  async function deleteHabit(id) {
    setState({ error: null });
    try {
      await api.deleteHabit(id);
      setState("habits", (h) => h.filter((x) => x.id !== id));
      // Clear selection if the deleted habit was selected
      if (state.selectedHabitId === id) {
        setState({ selectedHabitId: null });
      }
    } catch (err) {
      setState({ error: err.message });
    }
  }

  // ── Completion ──────────────────────────────────────────────────────────

  /** Optimistic toggle: assume success immediately, roll back on error. */
  async function toggleCompleteOptimistic(habitId) {
    const dateString = todayLocal();
    setState({ error: null });

    // Optimistic add
    setState("optimisticCompletions", (list) => [...list, habitId]);

    try {
      await api.completeHabit(habitId, dateString);
      // Success — keep the optimistic flag; refetch progress if this habit is selected
      if (state.selectedHabitId === habitId) {
        await fetchProgress(habitId);
      }
    } catch (err) {
      // Rollback
      setState("optimisticCompletions", (list) => list.filter((id) => id !== habitId));
      setState({ error: err.message });
    }
  }

  /** Legacy complete (non-optimistic, for backward compatibility). */
  async function completeHabit(id, dateString) {
    setState({ error: null });
    try {
      await api.completeHabit(id, dateString);
      await fetchHabits();
    } catch (err) {
      setState({ error: err.message });
    }
  }

  // ── Selection & Progress ────────────────────────────────────────────────

  /** Select a habit to view its progress grid. */
  function selectHabit(id) {
    setState({ selectedHabitId: id });
  }

  /** Fetch progress for a habit and store it keyed by habitId. */
  async function fetchProgress(habitId) {
    if (!habitId) return;
    try {
      const data = await api.getProgress(habitId);
      setState("progress", habitId, data);
    } catch (err) {
      setState({ error: err.message });
    }
  }

  // ── Value ───────────────────────────────────────────────────────────────

  const value = {
    state,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    // Mission 2
    toggleCompleteOptimistic,
    selectHabit,
    fetchProgress,
    isOptimistic: (id) => state.optimisticCompletions.includes(id),
  };

  return (
    <HabitContext.Provider value={value}>
      {props.children}
    </HabitContext.Provider>
  );
}
