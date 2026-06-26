import { describe, expect, it } from "vitest";
import {
  assertCanSetDriverAvailability,
  canSetDriverOffline,
  canSetDriverOnline,
} from "@/server/drivers/availability-rules";

describe("driver availability rules", () => {
  it("permite motorista aprovado e livre ficar online", () => {
    expect(
      canSetDriverOnline({
        status: "APPROVED",
        approvedVehicles: 1,
        currentAvailability: "OFFLINE",
      }),
    ).toBe(true);
  });

  it("bloqueia motorista sem veiculo aprovado", () => {
    expect(
      canSetDriverOnline({
        status: "APPROVED",
        approvedVehicles: 0,
        currentAvailability: "OFFLINE",
      }),
    ).toBe(false);
  });

  it("bloqueia motorista pendente", () => {
    expect(() =>
      assertCanSetDriverAvailability({
        targetAvailability: "ONLINE",
        status: "PENDING",
        approvedVehicles: 1,
        currentAvailability: "OFFLINE",
      }),
    ).toThrow("Motorista precisa estar aprovado");
  });

  it("bloqueia alteracao durante corrida", () => {
    expect(canSetDriverOffline({ currentAvailability: "BUSY" })).toBe(false);
    expect(() =>
      assertCanSetDriverAvailability({
        targetAvailability: "OFFLINE",
        status: "APPROVED",
        approvedVehicles: 1,
        currentAvailability: "BUSY",
      }),
    ).toThrow("Motorista em corrida");
  });
});
