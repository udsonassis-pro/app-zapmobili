import { describe, expect, it } from "vitest";
import {
  commissionPercentToRate,
  commissionRateToPercent,
  createVehicleCategorySchema,
  publishFareRuleSchema,
} from "@/server/pricing/admin-schemas";

describe("admin pricing", () => {
  it("valida categoria de veiculo", () => {
    const parsed = createVehicleCategorySchema.parse({
      name: "Executivo",
      slug: "executivo",
      description: "Categoria premium",
      seats: 4,
      acceptsMoto: false,
    });

    expect(parsed.slug).toBe("executivo");
  });

  it("rejeita slug invalido", () => {
    const parsed = createVehicleCategorySchema.safeParse({
      name: "Executivo",
      slug: "Executivo Premium",
      seats: 4,
      acceptsMoto: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("valida tarifa publicada", () => {
    const parsed = publishFareRuleSchema.parse({
      name: "Tarifa urbana",
      baseFare: 6,
      pricePerKm: 3,
      pricePerMinute: 0.5,
      minimumFare: 16,
      cancellationFee: 8,
      platformCommissionRate: 0.08,
      tenantCommissionRate: 0.12,
    });

    expect(parsed.minimumFare).toBe(16);
  });

  it("converte comissao entre porcentagem e taxa", () => {
    expect(commissionPercentToRate(12.5)).toBe(0.125);
    expect(commissionRateToPercent(0.125)).toBe(12.5);
  });
});
