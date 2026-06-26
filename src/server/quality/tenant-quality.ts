import { prisma } from "@/lib/prisma";
import {
  calculateRatingAverage,
  normalizeQualityReportFilters,
  ratingDateRangeFromFilters,
} from "@/server/quality/quality-filters";

export async function getTenantQualityReport(
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

  const filters = normalizeQualityReportFilters(rawFilters);
  const createdAt = ratingDateRangeFromFilters(filters);
  const where = {
    tenantId: tenant.id,
    ...(createdAt ? { createdAt } : {}),
  };

  const [ratings, totals, byScore] = await Promise.all([
    prisma.rating.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        driver: { include: { user: { select: { name: true } } } },
        passenger: { include: { user: { select: { name: true } } } },
        ride: {
          include: {
            passenger: { include: { user: { select: { name: true } } } },
            driver: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.rating.aggregate({
      where,
      _count: { _all: true },
      _sum: { score: true },
      _avg: { score: true },
    }),
    prisma.rating.groupBy({
      by: ["score"],
      where,
      _count: { _all: true },
      orderBy: { score: "desc" },
    }),
  ]);

  const driverRatings = ratings.filter((rating) => rating.driverId);
  const passengerRatings = ratings.filter((rating) => rating.passengerId);
  const driverMap = new Map<
    string,
    {
      driverId: string;
      driverName: string;
      count: number;
      totalScore: number;
      latestComment: string | null;
      latestRideId: string;
    }
  >();

  for (const rating of driverRatings) {
    if (!rating.driverId || !rating.driver) {
      continue;
    }

    const current = driverMap.get(rating.driverId) ?? {
      driverId: rating.driverId,
      driverName: rating.driver.user.name,
      count: 0,
      totalScore: 0,
      latestComment: null,
      latestRideId: rating.rideId,
    };

    current.count += 1;
    current.totalScore += rating.score;
    current.latestComment ??= rating.comment;
    current.latestRideId = current.latestComment ? current.latestRideId : rating.rideId;
    driverMap.set(rating.driverId, current);
  }

  const drivers = Array.from(driverMap.values())
    .map((item) => ({
      ...item,
      average: calculateRatingAverage({
        totalScore: item.totalScore,
        count: item.count,
      }),
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count);

  const recentComments = ratings
    .filter((rating) => rating.comment)
    .slice(0, 20)
    .map((rating) => ({
      id: rating.id,
      rideId: rating.rideId,
      score: rating.score,
      comment: rating.comment,
      createdAt: rating.createdAt,
      target:
        rating.driver?.user.name ??
        rating.passenger?.user.name ??
        "Perfil avaliado",
      author:
        rating.driverId
          ? rating.ride.passenger.user.name
          : (rating.ride.driver?.user.name ?? "Motorista"),
    }));

  return {
    tenant,
    filters,
    totals: {
      ratings: totals._count._all,
      average: Number(totals._avg.score ?? 0),
      driverRatings: driverRatings.length,
      passengerRatings: passengerRatings.length,
    },
    byScore,
    drivers,
    recentComments,
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function buildTenantQualityCsv(
  report: Awaited<ReturnType<typeof getTenantQualityReport>>,
) {
  const rows = [
    [
      "rating_id",
      "ride_id",
      "created_at",
      "score",
      "target",
      "author",
      "comment",
    ],
    ...report.recentComments.map((comment) => [
      comment.id,
      comment.rideId,
      comment.createdAt.toISOString(),
      comment.score,
      comment.target,
      comment.author,
      comment.comment ?? "",
    ]),
    [],
    ["driver_id", "driver_name", "average", "count", "latest_ride_id"],
    ...report.drivers.map((driver) => [
      driver.driverId,
      driver.driverName,
      driver.average.toFixed(2),
      driver.count,
      driver.latestRideId,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
