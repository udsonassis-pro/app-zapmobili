import { describe, expect, it } from "vitest";
import { calculateDriverEarning } from "@/server/payments/financial-calculations";
import { canTransitionRide } from "@/server/rides/status";

describe("ride financials", () => {
  it("calcula ganho liquido do motorista", () => {
    expect(
      calculateDriverEarning({
        total: 37.76,
        platformCommission: 3.02,
        tenantCommission: 4.53,
      }),
    ).toBe(30.21);
  });

  it("permite fluxo financeiro depois de concluir corrida", () => {
    expect(canTransitionRide("COMPLETED", "PAYMENT_PENDING")).toBe(true);
    expect(canTransitionRide("PAYMENT_PENDING", "PAID")).toBe(true);
  });
});
