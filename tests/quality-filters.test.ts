import { describe, expect, it } from "vitest";
import {
  calculateRatingAverage,
  normalizeQualityReportFilters,
  ratingDateRangeFromFilters,
} from "@/server/quality/quality-filters";

describe("quality report filters", () => {
  it("normaliza filtros validos", () => {
    expect(
      normalizeQualityReportFilters({
        from: "2026-06-01",
        to: "2026-06-30",
      }),
    ).toEqual({
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("ignora filtros invalidos", () => {
    expect(normalizeQualityReportFilters({ from: "ontem" })).toEqual({});
  });

  it("gera intervalo de datas inclusivo", () => {
    const range = ratingDateRangeFromFilters({
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(range?.gte?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(range?.lte?.toISOString()).toBe("2026-06-30T23:59:59.999Z");
  });

  it("calcula media de avaliacoes com duas casas", () => {
    expect(calculateRatingAverage({ totalScore: 13, count: 3 })).toBe(4.33);
    expect(calculateRatingAverage({ totalScore: 0, count: 0 })).toBe(0);
  });
});
