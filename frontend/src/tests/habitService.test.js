import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  getProgress,
} from "../services/habitService";

const BASE_URL = "http://localhost:8000/api/v1";

describe("habitService", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  function mockResponse(body, status = 200) {
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });
  }

  function mockNetworkError() {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  }

  // ── getHabits ──────────────────────────────────────────────────

  describe("getHabits", () => {
    it("calls GET /habits and returns parsed JSON", async () => {
      const habits = [{ id: 1, title: "Read" }];
      mockResponse(habits);

      const result = await getHabits();

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/habits`, {
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(habits);
    });

    it("throws on network error", async () => {
      mockNetworkError();
      await expect(getHabits()).rejects.toThrow("Falha de rede");
    });

    it("throws on non-ok response with detail", async () => {
      mockResponse({ detail: "Server error" }, 500);
      await expect(getHabits()).rejects.toThrow("Server error");
    });

    it("throws on non-ok response without detail", async () => {
      mockResponse({}, 500);
      await expect(getHabits()).rejects.toThrow("Erro 500");
    });
  });

  // ── createHabit ─────────────────────────────────────────────────

  describe("createHabit", () => {
    it("POSTs /habits with JSON body", async () => {
      const created = { id: 1, title: "Read", frequency: "daily" };
      mockResponse(created, 201);

      const result = await createHabit({ title: "Read", frequency: "daily" });

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Read", frequency: "daily" }),
      });
      expect(result).toEqual(created);
    });
  });

  // ── updateHabit ─────────────────────────────────────────────────

  describe("updateHabit", () => {
    it("PUTs /habits/:id with partial body", async () => {
      const updated = { id: 1, title: "New", frequency: "daily" };
      mockResponse(updated);

      const result = await updateHabit(1, { title: "New" });

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/habits/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New" }),
      });
      expect(result).toEqual(updated);
    });
  });

  // ── deleteHabit ─────────────────────────────────────────────────

  describe("deleteHabit", () => {
    it("DELETEs /habits/:id and returns null on 204", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("no body");
        },
      });

      const result = await deleteHabit(1);

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/habits/1`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toBeNull();
    });

    it("throws on non-ok delete", async () => {
      mockResponse({ detail: "Not found" }, 404);
      await expect(deleteHabit(999)).rejects.toThrow("Not found");
    });
  });

  // ── completeHabit ───────────────────────────────────────────────

  describe("completeHabit", () => {
    it("POSTs /habits/:id/complete?date= with date param", async () => {
      const habit = { id: 1, title: "Read" };
      mockResponse(habit);

      const result = await completeHabit(1, "2026-05-11");

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/habits/1/complete?date=2026-05-11`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      expect(result).toEqual(habit);
    });
  });

  // ── getProgress ─────────────────────────────────────────────────

  describe("getProgress", () => {
    it("GETs /habits/:id/progress", async () => {
      const progress = { habit_id: 1, frequency: "daily", completions: [], streak: 0 };
      mockResponse(progress);

      const result = await getProgress(1);

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/habits/1/progress`, {
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(progress);
    });
  });
});
