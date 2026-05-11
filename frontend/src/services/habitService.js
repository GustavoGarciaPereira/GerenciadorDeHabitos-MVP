/**
 * Habit service — all HTTP calls to the FastAPI backend.
 * Every function throws on non-ok responses with a user-friendly message.
 */

const BASE_URL = "http://localhost:8000/api/v1";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch (err) {
    throw new Error("Falha de rede — verifique se o backend está rodando.");
  }

  if (res.status === 204) return null; // no content

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.detail || `Erro ${res.status} — requisição falhou.`);
  }

  return body;
}

// ── Habits CRUD ──────────────────────────────────────────────────────────────

export function getHabits() {
  return request("/habits");
}

export function createHabit({ title, frequency }) {
  return request("/habits", {
    method: "POST",
    body: JSON.stringify({ title, frequency }),
  });
}

export function updateHabit(id, { title, frequency }) {
  return request(`/habits/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, frequency }),
  });
}

export function deleteHabit(id) {
  return request(`/habits/${id}`, { method: "DELETE" });
}

// ── Completion ───────────────────────────────────────────────────────────────

/**
 * Mark a habit as completed on `dateString` (YYYY-MM-DD, local timezone).
 */
export function completeHabit(id, dateString) {
  return request(`/habits/${id}/complete?date=${dateString}`, {
    method: "POST",
  });
}

// ── Progress ─────────────────────────────────────────────────────────────────

export function getProgress(id) {
  return request(`/habits/${id}/progress`);
}
