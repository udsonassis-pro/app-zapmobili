import { z } from "zod";
import { rideStatuses } from "@/server/rides/status";

export const rideHistoryFilterSchema = z.object({
  status: z.enum(rideStatuses).optional(),
  query: z.string().trim().max(120).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export type RideHistoryFilters = z.infer<typeof rideHistoryFilterSchema>;

export function normalizeRideHistoryFilters(input: unknown) {
  const parsed = rideHistoryFilterSchema.safeParse(input);

  if (!parsed.success) {
    return {};
  }

  return {
    status: parsed.data.status,
    query: parsed.data.query || undefined,
    from: parsed.data.from,
    to: parsed.data.to,
  } satisfies RideHistoryFilters;
}

export function dateRangeFromFilters(filters: RideHistoryFilters) {
  const range: { gte?: Date; lte?: Date } = {};

  if (filters.from) {
    range.gte = new Date(`${filters.from}T00:00:00.000Z`);
  }

  if (filters.to) {
    range.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }

  return Object.keys(range).length > 0 ? range : undefined;
}
