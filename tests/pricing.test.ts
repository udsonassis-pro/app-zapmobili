import { describe, expect, it } from "vitest";
import { calculateRidePrice } from "@/server/pricing/pricing";

describe("calculateRidePrice", () => {
  it("calcula preco com distancia, tempo e comissoes", () => {
    const estimate = calculateRidePrice({
      distanceKm: 8.4,
      durationMinutes: 22,
      fareRule: {
        baseFare: 5,
        pricePerKm: 2.8,
        pricePerMinute: 0.42,
        minimumFare: 14,
        platformCommissionRate: 0.08,
        tenantCommissionRate: 0.12,
      },
    });

    expect(estimate.total).toBe(37.76);
    expect(estimate.platformCommission).toBe(3.02);
    expect(estimate.tenantCommission).toBe(4.53);
    expect(estimate.driverEarning).toBe(30.21);
  });

  it("aplica tarifa minima", () => {
    const estimate = calculateRidePrice({
      distanceKm: 1,
      durationMinutes: 2,
      fareRule: {
        baseFare: 5,
        pricePerKm: 2,
        pricePerMinute: 0.5,
        minimumFare: 14,
        platformCommissionRate: 0.1,
        tenantCommissionRate: 0.1,
      },
    });

    expect(estimate.total).toBe(14);
  });
});
