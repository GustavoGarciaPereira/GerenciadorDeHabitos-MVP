import { createSignal } from "solid-js";
import { useHabits } from "../../store/habitStore";

/**
 * Returns today's date in local timezone as YYYY-MM-DD.
 */
function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HabitCard(props) {
  const { completeHabit, deleteHabit } = useHabits();
  const [completing, setCompleting] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await completeHabit(props.habit.id, todayLocal());
    } finally {
      setCompleting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteHabit(props.habit.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div class="habit-card">
      <div class="habit-card__header">
        <span
          class={`habit-card__badge habit-card__badge--${props.habit.frequency}`}
        >
          {props.habit.frequency === "daily" ? "Diário" : "Semanal"}
        </span>
        <button
          class="habit-card__delete"
          onClick={handleDelete}
          disabled={deleting()}
          aria-label="Excluir hábito"
          type="button"
        >
          {deleting() ? "…" : "🗑"}
        </button>
      </div>

      <h3 class="habit-card__title">{props.habit.title}</h3>

      <label class="habit-card__check">
        <input
          type="checkbox"
          onChange={handleComplete}
          disabled={completing()}
        />
        <span>Concluir hoje</span>
      </label>
    </div>
  );
}
