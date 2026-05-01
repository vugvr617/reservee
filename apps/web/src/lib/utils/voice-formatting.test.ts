import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  formatTimeSpoken,
  formatDateSpoken,
  normalizeToolCall,
} from "./voice-formatting";

describe("normalizePhone", () => {
  it("returns empty string for null", () => {
    expect(normalizePhone(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(normalizePhone(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhone("")).toBe("");
  });

  it("preserves a leading + sign", () => {
    expect(normalizePhone("+994501234567")).toBe("+994501234567");
  });

  it("strips spaces, parentheses, and dashes", () => {
    expect(normalizePhone("+994 (50) 123-45-67")).toBe("+994501234567");
  });

  it("strips letters and other punctuation, leaving only digits and +", () => {
    expect(normalizePhone("Tel: +1-800-CALL-NOW")).toBe("+1800");
  });

  it("treats two callers as equal once normalized", () => {
    expect(normalizePhone("+1 (234) 567-8900")).toBe(
      normalizePhone("+12345678900")
    );
  });
});

describe("formatTimeSpoken", () => {
  it("formats a morning hour", () => {
    expect(formatTimeSpoken("09:00")).toBe("9 AM");
  });

  it("formats an evening hour", () => {
    expect(formatTimeSpoken("19:00")).toBe("7 PM");
  });

  it("formats midnight as 12 AM", () => {
    expect(formatTimeSpoken("00:00")).toBe("12 AM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatTimeSpoken("12:00")).toBe("12 PM");
  });

  it("formats half hours with two-digit minutes", () => {
    expect(formatTimeSpoken("20:30")).toBe("8:30 PM");
  });

  it("zero-pads single-digit minutes", () => {
    expect(formatTimeSpoken("14:05")).toBe("2:05 PM");
  });
});

describe("formatDateSpoken", () => {
  it("includes weekday, month, and day", () => {
    // 2026-05-15 is a Friday in the Gregorian calendar
    expect(formatDateSpoken("2026-05-15")).toBe("Friday, May 15");
  });

  it("formats the first day of a month", () => {
    expect(formatDateSpoken("2026-01-01")).toBe("Thursday, January 1");
  });

  it("formats end-of-year dates without padding", () => {
    expect(formatDateSpoken("2026-12-31")).toBe("Thursday, December 31");
  });
});

describe("normalizeToolCall", () => {
  it("reads name and arguments from the top-level shape (model.tools)", () => {
    const result = normalizeToolCall({
      id: "call-1",
      name: "check_availability",
      arguments: { date: "2026-05-15", time: "19:00", party_size: 4 },
    });
    expect(result.id).toBe("call-1");
    expect(result.name).toBe("check_availability");
    expect(result.args.date).toBe("2026-05-15");
    expect(result.args.party_size).toBe(4);
  });

  it("reads name and arguments from the nested function shape (Custom Tools)", () => {
    const result = normalizeToolCall({
      id: "call-2",
      function: {
        name: "create_reservation",
        arguments: { guest_name: "Vugar", party_size: 2 },
      },
    });
    expect(result.name).toBe("create_reservation");
    expect(result.args.guest_name).toBe("Vugar");
  });

  it("parses string-encoded arguments (JSON in the function shape)", () => {
    const result = normalizeToolCall({
      id: "call-3",
      function: {
        name: "cancel_reservation",
        arguments: '{"date":"2026-05-15"}',
      },
    });
    expect(result.args.date).toBe("2026-05-15");
  });

  it("falls back to 'unknown' when no name is provided", () => {
    const result = normalizeToolCall({ id: "call-4" });
    expect(result.name).toBe("unknown");
    expect(result.args).toEqual({});
  });

  it("prefers the top-level name when both shapes are present", () => {
    const result = normalizeToolCall({
      id: "call-5",
      name: "check_availability",
      function: { name: "create_reservation", arguments: {} },
    });
    expect(result.name).toBe("check_availability");
  });
});
