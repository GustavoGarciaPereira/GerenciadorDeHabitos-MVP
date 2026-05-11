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

// ── Provider ─────────────────────────────────────────────────────────────────

export function HabitProvider(props) {
  const [state, setState] = createStore({
    habits: [],
    loading: false,
    error: null,
  });

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

  /** Delete a habit, then refresh the list. */
  async function deleteHabit(id) {
    setState({ error: null });
    try {
      await api.deleteHabit(id);
      setState("habits", (h) => h.filter((x) => x.id !== id));
    } catch (err) {
      setState({ error: err.message });
    }
  }

  /** Mark a habit completed on a given date, then refresh. */
  async function completeHabit(id, dateString) {
    setState({ error: null });
    try {
      await api.completeHabit(id, dateString);
      // Refetch so any derived state stays in sync.
      await fetchHabits();
    } catch (err) {
      setState({ error: err.message });
    }
  }

  const value = {
    state,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
  };

  return (
    <HabitContext.Provider value={value}>
      {props.children}
    </HabitContext.Provider>
  );
}
