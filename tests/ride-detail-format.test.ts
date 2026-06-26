import { describe, expect, it } from "vitest";
import {
  canCancelFromDetails,
  canUserRateRide,
  canUserCancelRide,
  getRideDisplayPrice,
} from "@/server/rides/detail-format";

describe("ride detail format", () => {
  it("usa preco final quando a corrida foi finalizada", () => {
    expect(getRideDisplayPrice({ estimatedPrice: 30, finalPrice: 42 })).toBe(42);
  });

  it("usa estimativa quando ainda nao existe preco final", () => {
    expect(getRideDisplayPrice({ estimatedPrice: 30, finalPrice: null })).toBe(
      30,
    );
  });

  it("permite cancelamento em corrida operacional ativa", () => {
    expect(canCancelFromDetails("DRIVER_ARRIVING")).toBe(true);
  });

  it("bloqueia cancelamento apos pagamento", () => {
    expect(canCancelFromDetails("PAID")).toBe(false);
  });

  it("permite cancelamento pelo passageiro antes da corrida iniciar", () => {
    expect(canUserCancelRide("PASSENGER", "SEARCHING_DRIVER")).toBe(true);
    expect(canUserCancelRide("PASSENGER", "DRIVER_ARRIVED")).toBe(true);
    expect(canUserCancelRide("PASSENGER", "IN_PROGRESS")).toBe(false);
  });

  it("permite cancelamento pelo motorista apenas depois do aceite", () => {
    expect(canUserCancelRide("DRIVER", "SEARCHING_DRIVER")).toBe(false);
    expect(canUserCancelRide("DRIVER", "DRIVER_ASSIGNED")).toBe(true);
    expect(canUserCancelRide("DRIVER", "IN_PROGRESS")).toBe(false);
  });

  it("permite avaliacao apenas apos corrida concluida e sem avaliacao anterior", () => {
    expect(
      canUserRateRide({
        status: "PAYMENT_PENDING",
        hasTarget: true,
        alreadyRated: false,
      }),
    ).toBe(true);
    expect(
      canUserRateRide({
        status: "DRIVER_ASSIGNED",
        hasTarget: true,
        alreadyRated: false,
      }),
    ).toBe(false);
    expect(
      canUserRateRide({
        status: "PAID",
        hasTarget: true,
        alreadyRated: true,
      }),
    ).toBe(false);
  });
});
