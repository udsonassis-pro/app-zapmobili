import { describe, expect, it } from "vitest";
import {
  calculateTicketAverage,
  normalizeFinanceReportFilters,
  paymentDateRangeFromFilters,
} from "@/server/payments/report-filters";

describe("finance report filters", () => {
  it("normaliza periodo valido", () => {
    expect(
      normalizeFinanceReportFilters({
        from: "2026-06-01",
        to: "2026-06-25",
      }),
    ).toEqual({ from: "2026-06-01", to: "2026-06-25" });
  });

  it("descarta periodo invalido", () => {
    expect(normalizeFinanceReportFilters({ from: "ontem" })).toEqual({});
  });

  it("monta intervalo de pagamento ate fim do dia", () => {
    const range = paymentDateRangeFromFilters({
      from: "2026-06-01",
      to: "2026-06-25",
    });

    expect(range?.gte?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(range?.lte?.toISOString()).toBe("2026-06-25T23:59:59.999Z");
  });

  it("calcula ticket medio com arredondamento", () => {
    expect(calculateTicketAverage({ revenue: 100, paidRides: 3 })).toBe(33.33);
  });

  it("mantem ticket medio zerado sem corridas pagas", () => {
    expect(calculateTicketAverage({ revenue: 100, paidRides: 0 })).toBe(0);
  });
});
