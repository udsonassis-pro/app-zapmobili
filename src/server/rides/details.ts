import { prisma } from "@/lib/prisma";
import {
  canCancelFromDetails,
  canUserRateRide,
  canUserCancelRide,
  getRideDisplayPrice,
} from "@/server/rides/detail-format";

export async function getTenantRideDetails(
  tenantSlug: string,
  rideId: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, tenantId: tenant.id },
    include: {
      passenger: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      driver: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          wallet: true,
        },
      },
      vehicle: { include: { category: true } },
      vehicleCategory: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      ratings: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  const walletTransactions = await prisma.walletTransaction.findMany({
    where: { tenantId: tenant.id, rideId: ride.id },
    orderBy: { createdAt: "desc" },
  });

  return {
    tenant,
    ride,
    walletTransactions,
    displayPrice: getRideDisplayPrice({
      estimatedPrice: Number(ride.estimatedPrice),
      finalPrice: ride.finalPrice === null ? null : Number(ride.finalPrice),
    }),
    canCancel: canCancelFromDetails(ride.status),
  };
}

export async function getUserRideDetails(userId: string, rideId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      passengerProfile: true,
      driverProfile: true,
    },
  });

  if (!user) {
    throw new Error("Usuario nao encontrado.");
  }

  const accessFilters = [
    user.passengerProfile
      ? { passengerId: user.passengerProfile.id }
      : null,
    user.driverProfile ? { driverId: user.driverProfile.id } : null,
  ].filter((filter): filter is { passengerId: string } | { driverId: string } =>
    Boolean(filter),
  );

  if (accessFilters.length === 0) {
    throw new Error("Usuario sem acesso a corridas.");
  }

  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: accessFilters,
    },
    include: {
      passenger: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      driver: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      vehicle: { include: { category: true } },
      vehicleCategory: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      ratings: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  const viewerRole: "DRIVER" | "PASSENGER" =
    user.driverProfile?.id === ride.driverId ? "DRIVER" : "PASSENGER";
  const currentUserRating = ride.ratings.find((rating) =>
    viewerRole === "DRIVER"
      ? rating.passengerId === ride.passengerId
      : rating.driverId === ride.driverId,
  );
  const hasRatingTarget =
    viewerRole === "DRIVER" ? Boolean(ride.passengerId) : Boolean(ride.driverId);

  return {
    ride,
    viewerRole,
    currentUserRating,
    displayPrice: getRideDisplayPrice({
      estimatedPrice: Number(ride.estimatedPrice),
      finalPrice: ride.finalPrice === null ? null : Number(ride.finalPrice),
    }),
    canCancel: canUserCancelRide(viewerRole, ride.status),
    canRate: canUserRateRide({
      status: ride.status,
      hasTarget: hasRatingTarget,
      alreadyRated: Boolean(currentUserRating),
    }),
  };
}
