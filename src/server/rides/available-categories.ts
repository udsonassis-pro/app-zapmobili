import { prisma } from "@/lib/prisma";
import { calculateRidePrice } from "@/server/pricing/pricing";

export async function listAvailableRideCategoriesForUser(
  userId: string,
  input: { distanceKm: number; durationMinutes: number },
) {
  const passenger = await prisma.passengerProfile.findUnique({
    where: { userId },
    select: { tenantId: true, deletedAt: true },
  });

  if (!passenger || passenger.deletedAt) {
    throw new Error("Perfil de passageiro nao encontrado.");
  }

  const categories = await prisma.vehicleCategory.findMany({
    where: {
      tenantId: passenger.tenantId,
      active: true,
      fareRules: { some: { active: true } },
    },
    orderBy: { createdAt: "asc" },
    include: {
      fareRules: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return categories.map((category) => {
    const fareRule = category.fareRules[0];
    const estimate = calculateRidePrice({
      distanceKm: input.distanceKm,
      durationMinutes: input.durationMinutes,
      fareRule: {
        baseFare: Number(fareRule.baseFare),
        pricePerKm: Number(fareRule.pricePerKm),
        pricePerMinute: Number(fareRule.pricePerMinute),
        minimumFare: Number(fareRule.minimumFare),
        platformCommissionRate: Number(fareRule.platformCommissionRate),
        tenantCommissionRate: Number(fareRule.tenantCommissionRate),
      },
    });

    return { category, fareRule, estimate };
  });
}
