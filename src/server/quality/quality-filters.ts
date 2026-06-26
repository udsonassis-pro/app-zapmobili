import { z } from "zod";

export const qualityReportFilterSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export type QualityReportFilters = z.infer<typeof qualityReportFilterSchema>;

export function normalizeQualityReportFilters(input: unknown) {
  const parsed = qualityReportFilterSchema.safeParse(input);

  if (!parsed.success) {
    return {};
  }

  return parsed.data satisfies QualityReportFilters;
}

export function ratingDateRangeFromFilters(filters: QualityReportFilters) {
  const range: { gte?: Date; lte?: Date } = {};

  if (filters.from) {
    range.gte = new Date(`${filters.from}T00:00:00.000Z`);
  }

  if (filters.to) {
    range.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

export function calculateRatingAverage(input: {
  totalScore: number;
  count: number;
}) {
  if (input.count === 0) {
    return 0;
  }

  return Math.round((input.totalScore / input.count) * 100) / 100;
}
