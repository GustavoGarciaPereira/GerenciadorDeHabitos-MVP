import { createResource, For, Show, createMemo } from "solid-js";
import { getProgress } from "../../services/habitService";
import Loader from "../ui/Loader";
import ErrorMessage from "../ui/ErrorMessage";

/** Build an array of 7 Date objects ending on today (today...today-6). */
function last7Dates() {
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function fmtDM(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return dd + "/" + mm;
}

function mondayOfWeek(d) {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const m = new Date(d);
  m.setDate(d.getDate() - diff);
  return m;
}

function computeBestStreak(dates, frequency) {
  if (dates.length < 2) return dates.length;
  const sorted = [...dates].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]);
    const b = new Date(sorted[i]);
    const gap = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
    if (frequency === "daily" && gap === 1) {
      cur++;
    } else if (frequency === "weekly" && gap === 7) {
      cur++;
    } else {
      if (cur > best) best = cur;
      cur = 1;
    }
  }
  if (cur > best) best = cur;
  return best;
}

export default function HabitGrid(props) {
  const [res] = createResource(() => props.habitId, getProgress);
  const data = () => res();

  const bestStreakVal = createMemo(() => {
    const p = data();
    if (!p || !p.completions) return 0;
    return computeBestStreak(p.completions, p.frequency);
  });

  return (
    <div class="habit-grid-wrapper">
      <Show when={res.loading}>
        <Loader />
      </Show>
      <Show when={res.error}>
        <ErrorMessage message="Erro ao carregar progresso" />
      </Show>
      <Show when={data()}>
        {() => {
          const p = data();
          const isDaily = p.frequency === "daily";
          const cells = isDaily ? last7Dates() : [];
          // For weekly: 7 most recent Monday dates
          if (!isDaily) {
            const today = new Date();
            const curMonday = mondayOfWeek(today);
            for (let i = 6; i >= 0; i--) {
              const m = new Date(curMonday);
              m.setDate(m.getDate() - i * 7);
              cells.push(m);
            }
          }
          const completions = new Set(p.completions || []);
          const streakLabel = isDaily ? "dias" : "semanas";
          const todayStr = fmtYMD(new Date());
          const todayMondayStr = fmtYMD(mondayOfWeek(new Date()));

          return (
            <>
              <div class="habit-grid">
                <For each={cells}>
                  {(cellDate) => {
                    const dateStr = fmtYMD(cellDate);
                    const key = isDaily ? dateStr : fmtYMD(mondayOfWeek(cellDate));
                    const completed = completions.has(key);
                    const isToday = isDaily
                      ? dateStr === todayStr
                      : key === todayMondayStr;
                    return (
                      <div class="habit-grid__cell-wrapper">
                        <div
                          class={"habit-grid__cell " + (completed
                            ? "habit-grid__cell--completed"
                            : "habit-grid__cell--pending") + (isToday
                            ? " habit-grid__cell--today"
                            : "")}
                        />
                        <span class="habit-grid__label">
                          {isDaily
                            ? ["D","S","T","Q","Q","S","S"][cellDate.getDay()]
                            : fmtDM(cellDate)}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>
              <p class="habit-streak">
                U0001f525 {p.streak} {streakLabel}
                <Show when={bestStreakVal() > p.streak}>
                  {"  (melhor: " + bestStreakVal() + ")"}
                </Show>
              </p>
            </>
          );
        }}
      </Show>
    </div>
  );
}
