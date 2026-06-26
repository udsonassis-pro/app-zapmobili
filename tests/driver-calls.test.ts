import { describe, expect, it } from "vitest";
import { assertRideTransition, canTransitionRide } from "@/server/rides/status";

describe("driver call flow", () => {
  it("permite motorista aceitar corrida em busca", () => {
    expect(canTransitionRide("SEARCHING_DRIVER", "DRIVER_ASSIGNED")).toBe(true);
  });

  it("bloqueia aceitar corrida ja paga", () => {
    expect(() => assertRideTransition("PAID", "DRIVER_ASSIGNED")).toThrow(
      "Transicao de corrida invalida",
    );
  });

  it("permite a execucao operacional depois do aceite", () => {
    expect(canTransitionRide("DRIVER_ASSIGNED", "DRIVER_ARRIVING")).toBe(true);
    expect(canTransitionRide("DRIVER_ARRIVING", "DRIVER_ARRIVED")).toBe(true);
    expect(canTransitionRide("DRIVER_ARRIVED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionRide("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("permite cancelamento operacional das corridas ativas", () => {
    expect(canTransitionRide("SEARCHING_DRIVER", "CANCELED_BY_SYSTEM")).toBe(
      true,
    );
    expect(canTransitionRide("DRIVER_ASSIGNED", "CANCELED_BY_SYSTEM")).toBe(
      true,
    );
    expect(canTransitionRide("IN_PROGRESS", "CANCELED_BY_SYSTEM")).toBe(true);
  });

  it("mantem corrida em busca quando motorista recusa chamada", () => {
    expect(canTransitionRide("SEARCHING_DRIVER", "SEARCHING_DRIVER")).toBe(
      false,
    );
  });
});
