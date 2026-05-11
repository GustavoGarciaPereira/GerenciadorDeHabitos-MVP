import { createSignal } from "solid-js";
import { useHabits } from "../../store/habitStore";

export default function HabitCard(props) {
  const { toggleCompleteOptimistic, deleteHabit, isOptimistic } = useHabits();
  const [deleting, setDeleting] = createSignal(false);

  const optimistic = () => isOptimistic(props.habit.id);

  async function handleComplete(e) {
    // Prevent the click from bubbling up to the card's onClick
    e.stopPropagation();
    await toggleCompleteOptimistic(props.habit.id);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    try {
      await deleteHabit(props.habit.id);
    } finally {
      setDeleting(false);
    }
  }

  function handleSelect() {
    if (props.onSelect) props.onSelect(props.habit.id);
  }

  return (
    <div
      class={`habit-card${optimistic() ? " habit-card--optimistic" : ""}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") handleSelect(); }}
    >
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
          checked={optimistic()}
          onChange={handleComplete}
        />
        <span>{optimistic() ? "Concluído ✓" : "Concluir hoje"}</span>
      </label>
    </div>
  );
}
