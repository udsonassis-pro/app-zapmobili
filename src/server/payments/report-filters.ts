import { z } from "zod";

export const financeReportFilterSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export type FinanceReportFilters = z.infer<typeof financeReportFilterSchema>;

export function normalizeFinanceReportFilters(input: unknown) {
  const parsed = financeReportFilterSchema.safeParse(input);

  if (!parsed.success) {
    return {};
  }

  return parsed.data satisfies FinanceReportFilters;
}

export function paymentDateRangeFromFilters(filters: FinanceReportFilters) {
  const range: { gte?: Date; lte?: Date } = {};

  if (filters.from) {
    range.gte = new Date(`${filters.from}T00:00:00.000Z`);
  }

  if (filters.to) {
    range.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

export function calculateTicketAverage(input: {
  revenue: number;
  paidRides: number;
}) {
  if (input.paidRides === 0) {
    return 0;
  }

  return Math.round((input.revenue / input.paidRides) * 100) / 100;
}
