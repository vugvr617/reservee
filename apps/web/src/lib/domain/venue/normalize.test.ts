import { describe, it, expect } from "vitest";
import { normalizeVenue } from "./normalize";

describe("normalizeVenue", () => {
  it("returns the same falsy value when the input is null", () => {
    expect(normalizeVenue(null)).toBeNull();
  });

  it("returns the same falsy value when the input is undefined", () => {
    expect(normalizeVenue(undefined)).toBeUndefined();
  });

  it("maps snake_case database fields to camelCase", () => {
    const result = normalizeVenue({
      id: "venue-1",
      ai_config: { greeting: "Welcome" },
      ai_status: "ready",
      vapi_agent_id: "asst_123",
    });
    expect(result.aiConfig).toEqual({ greeting: "Welcome" });
    expect(result.aiStatus).toBe("ready");
    expect(result.vapiAgentId).toBe("asst_123");
  });

  it("defaults aiStatus to 'draft' when both shapes are absent", () => {
    const result = normalizeVenue({ id: "venue-1" });
    expect(result.aiStatus).toBe("draft");
  });

  it("prefers an existing camelCase value over the snake_case fallback", () => {
    const result = normalizeVenue({
      id: "venue-1",
      ai_config: { fromSnake: true },
      aiConfig: { fromCamel: true },
    });
    expect(result.aiConfig).toEqual({ fromSnake: true });
  });

  it("preserves unrelated fields untouched", () => {
    const result = normalizeVenue({
      id: "venue-1",
      venueName: "Vugaritos",
      city: "Budapest",
    });
    expect(result.id).toBe("venue-1");
    expect(result.venueName).toBe("Vugaritos");
    expect(result.city).toBe("Budapest");
  });
});
