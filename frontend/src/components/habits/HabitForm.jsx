import { createSignal } from "solid-js";
import { useHabits } from "../../store/habitStore";

export default function HabitForm() {
  const { createHabit } = useHabits();
  const [title, setTitle] = createSignal("");
  const [frequency, setFrequency] = createSignal("daily");
  const [submitting, setSubmitting] = createSignal(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const t = title().trim();
    if (!t) return;

    setSubmitting(true);
    try {
      await createHabit({ title: t, frequency: frequency() });
      setTitle("");
      setFrequency("daily");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form class="habit-form" onSubmit={handleSubmit}>
      <h2 class="habit-form__heading">Novo hábito</h2>

      <label class="habit-form__label" for="habit-title">
        Título
      </label>
      <input
        id="habit-title"
        class="habit-form__input"
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
        placeholder="Ex: Ler 10 páginas"
        required
        maxlength={120}
      />

      <label class="habit-form__label" for="habit-frequency">
        Frequência
      </label>
      <select
        id="habit-frequency"
        class="habit-form__select"
        value={frequency()}
        onChange={(e) => setFrequency(e.currentTarget.value)}
      >
        <option value="daily">Diário</option>
        <option value="weekly">Semanal</option>
      </select>

      <button
        class="habit-form__submit"
        type="submit"
        disabled={submitting() || !title().trim()}
      >
        {submitting() ? "Criando…" : "Criar hábito"}
      </button>
    </form>
  );
}
