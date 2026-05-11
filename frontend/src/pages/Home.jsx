import { createResource, For, Show } from "solid-js";
import { useHabits } from "../store/habitStore";
import HabitCard from "../components/habits/HabitCard";
import HabitGrid from "../components/habits/HabitGrid";
import HabitForm from "../components/habits/HabitForm";
import Loader from "../components/ui/Loader";
import ErrorMessage from "../components/ui/ErrorMessage";

export default function Home() {
  const { state, fetchHabits } = useHabits();

  // Fetch habits on mount
  const [habitsResource] = createResource(fetchHabits);

  return (
    <div class="dashboard">
      <header class="dashboard__header">
        <h1 class="dashboard__title">Habit Tracker</h1>
      </header>

      <div class="dashboard__body">
        {/* Sidebar: form + progress placeholder */}
        <aside class="dashboard__sidebar">
          <HabitForm />
          <HabitGrid />
        </aside>

        {/* Main: habit list */}
        <main class="dashboard__main">
          {/* Error banner */}
          <Show when={state.error}>
            <ErrorMessage message={state.error} />
          </Show>

          {/* Loading */}
          <Show when={habitsResource.loading}>
            <Loader />
          </Show>

          {/* Empty state */}
          <Show when={!habitsResource.loading && state.habits.length === 0}>
            <p class="dashboard__empty">
              Nenhum hábito cadastrado ainda. Crie o primeiro no formulário ao lado!
            </p>
          </Show>

          {/* Habit cards */}
          <Show when={!habitsResource.loading && state.habits.length > 0}>
            <ul class="habit-list">
              <For each={state.habits}>
                {(habit) => (
                  <li>
                    <HabitCard habit={habit} />
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </main>
      </div>
    </div>
  );
}
