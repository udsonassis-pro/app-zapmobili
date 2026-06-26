import { describe, expect, it } from "vitest";
import {
  dateRangeFromFilters,
  normalizeRideHistoryFilters,
} from "@/server/rides/history-filters";

describe("ride history filters", () => {
  it("normaliza filtros validos", () => {
    expect(
      normalizeRideHistoryFilters({
        status: "PAID",
        query: "Ana",
        from: "2026-06-01",
        to: "2026-06-25",
      }),
    ).toEqual({
      status: "PAID",
      query: "Ana",
      from: "2026-06-01",
      to: "2026-06-25",
    });
  });

  it("descarta status invalido", () => {
    expect(normalizeRideHistoryFilters({ status: "INVALIDO" })).toEqual({});
  });

  it("monta intervalo ate o fim do dia final", () => {
    const range = dateRangeFromFilters({
      from: "2026-06-01",
      to: "2026-06-25",
    });

    expect(range?.gte?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(range?.lte?.toISOString()).toBe("2026-06-25T23:59:59.999Z");
  });
});
