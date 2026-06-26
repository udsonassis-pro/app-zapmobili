import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  dateRangeFromFilters,
  normalizeRideHistoryFilters,
  type RideHistoryFilters,
} from "@/server/rides/history-filters";

const rideHistoryInclude = {
  passenger: { include: { user: { select: { name: true } } } },
  driver: { include: { user: { select: { name: true } } } },
  vehicle: true,
  vehicleCategory: true,
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.RideInclude;

type RideHistoryItem = Prisma.RideGetPayload<{
  include: typeof rideHistoryInclude;
}>;

export async function listTenantRideHistory(
  tenantSlug: string,
  rawFilters: unknown,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const filters = normalizeRideHistoryFilters(rawFilters);
  const requestedAt = dateRangeFromFilters(filters);
  const where: Prisma.RideWhereInput = {
    tenantId: tenant.id,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (requestedAt) {
    where.requestedAt = requestedAt;
  }

  if (filters.query) {
    where.OR = [
      { originAddress: { contains: filters.query, mode: "insensitive" } },
      { destinationAddress: { contains: filters.query, mode: "insensitive" } },
      {
        passenger: {
          user: { name: { contains: filters.query, mode: "insensitive" } },
        },
      },
      {
        driver: {
          user: { name: { contains: filters.query, mode: "insensitive" } },
        },
      },
    ];
  }

  const [rides, total, byStatus] = await Promise.all([
    prisma.ride.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      take: 50,
      include: rideHistoryInclude,
    }),
    prisma.ride.count({ where }),
    prisma.ride.groupBy({
      by: ["status"],
      where: { tenantId: tenant.id },
      _count: { _all: true },
    }),
  ]);

  return {
    tenant,
    filters: filters satisfies RideHistoryFilters,
    rides: rides as RideHistoryItem[],
    total,
    byStatus,
  };
}
