import { describe, it, expect } from "vitest";
import { createReservationSchema } from "./schemas";

const valid = {
  guestName: "Vugar Nasraddinli",
  guestPhone: "+994501234567",
  partySize: 4,
  reservationDate: "2026-05-15",
  reservationTime: "19:00",
  tableId: null,
  specialRequests: null,
};

describe("createReservationSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = createReservationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects an empty guest name", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      guestName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Guest name is required");
    }
  });

  it("rejects a phone shorter than seven characters", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      guestPhone: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Valid phone number is required"
      );
    }
  });

  it("rejects a party size of zero", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      partySize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a party size above 50", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      partySize: 51,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Max 50 guests");
    }
  });

  it("coerces a numeric string party size", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      partySize: "4",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partySize).toBe(4);
      expect(typeof result.data.partySize).toBe("number");
    }
  });

  it("rejects a malformed date", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      reservationDate: "15/05/2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Valid date required");
    }
  });

  it("rejects a malformed time", () => {
    const result = createReservationSchema.safeParse({
      ...valid,
      reservationTime: "7pm",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Valid time required");
    }
  });

  it("treats specialRequests as optional", () => {
    const { specialRequests, ...withoutOptional } = valid;
    void specialRequests;
    const result = createReservationSchema.safeParse(withoutOptional);
    expect(result.success).toBe(true);
  });
});
