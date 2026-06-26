import { describe, expect, it } from "vitest";
import {
  assertCanDispatchDriver,
  canDispatchDriver,
} from "@/server/dispatch/dispatch-rules";

describe("dispatch rules", () => {
  it("permite despacho para motorista aprovado, online e com veiculo da categoria", () => {
    expect(
      canDispatchDriver({
        driverStatus: "APPROVED",
        availability: "ONLINE",
        hasApprovedVehicleForCategory: true,
      }),
    ).toBe(true);
  });

  it("bloqueia motorista pendente", () => {
    expect(
      canDispatchDriver({
        driverStatus: "PENDING",
        availability: "ONLINE",
        hasApprovedVehicleForCategory: true,
      }),
    ).toBe(false);
  });

  it("bloqueia motorista offline", () => {
    expect(
      canDispatchDriver({
        driverStatus: "APPROVED",
        availability: "OFFLINE",
        hasApprovedVehicleForCategory: true,
      }),
    ).toBe(false);
  });

  it("bloqueia motorista sem veiculo aprovado na categoria", () => {
    expect(() =>
      assertCanDispatchDriver({
        driverStatus: "APPROVED",
        availability: "ONLINE",
        hasApprovedVehicleForCategory: false,
      }),
    ).toThrow("Motorista precisa estar aprovado");
  });
});
