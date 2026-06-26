import { describe, expect, it } from "vitest";
import {
  assertRideTransition,
  canTransitionRide,
  isTerminalRideStatus,
} from "@/server/rides/status";

describe("ride status transitions", () => {
  it("permite o fluxo principal da corrida", () => {
    expect(canTransitionRide("REQUESTED", "SEARCHING_DRIVER")).toBe(true);
    expect(canTransitionRide("SEARCHING_DRIVER", "DRIVER_ASSIGNED")).toBe(true);
    expect(canTransitionRide("DRIVER_ASSIGNED", "DRIVER_ARRIVING")).toBe(true);
    expect(canTransitionRide("DRIVER_ARRIVING", "DRIVER_ARRIVED")).toBe(true);
    expect(canTransitionRide("DRIVER_ARRIVED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionRide("IN_PROGRESS", "COMPLETED")).toBe(true);
    expect(canTransitionRide("COMPLETED", "PAYMENT_PENDING")).toBe(true);
    expect(canTransitionRide("PAYMENT_PENDING", "PAID")).toBe(true);
  });

  it("bloqueia pulo de status inseguro", () => {
    expect(() => assertRideTransition("REQUESTED", "PAID")).toThrow(
      "Transicao de corrida invalida",
    );
  });

  it("marca status finais", () => {
    expect(isTerminalRideStatus("PAID")).toBe(true);
    expect(isTerminalRideStatus("CANCELED_BY_SYSTEM")).toBe(true);
    expect(isTerminalRideStatus("IN_PROGRESS")).toBe(false);
  });
});
