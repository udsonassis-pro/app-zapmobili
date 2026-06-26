import { prisma } from "@/lib/prisma";
import {
  buildRideNotificationMetadata,
  createInAppNotification,
} from "@/server/notifications/in-app";
import { calculateRidePrice } from "@/server/pricing/pricing";
import {
  createRideRequestSchema,
  type CreateRideRequestInput,
} from "@/server/rides/create-ride-schema";

export async function createRideRequest(userId: string, input: CreateRideRequestInput) {
  const parsed = createRideRequestSchema.parse(input);
  const passenger = await prisma.passengerProfile.findUnique({
    where: { userId },
    include: { tenant: true },
  });

  if (!passenger || passenger.deletedAt) {
    throw new Error("Perfil de passageiro nao encontrado.");
  }

  const category = await prisma.vehicleCategory.findFirst({
    where: {
      id: parsed.vehicleCategoryId,
      tenantId: passenger.tenantId,
      active: true,
    },
  });

  if (!category) {
    throw new Error("Categoria de veiculo indisponivel para este tenant.");
  }

  const fareRule = await prisma.fareRule.findFirst({
    where: {
      tenantId: passenger.tenantId,
      vehicleCategoryId: category.id,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!fareRule) {
    throw new Error("Nenhuma tarifa ativa para esta categoria.");
  }

  const estimate = calculateRidePrice({
    distanceKm: parsed.estimatedDistanceKm,
    durationMinutes: parsed.estimatedDurationMin,
    fareRule: {
      baseFare: Number(fareRule.baseFare),
      pricePerKm: Number(fareRule.pricePerKm),
      pricePerMinute: Number(fareRule.pricePerMinute),
      minimumFare: Number(fareRule.minimumFare),
      platformCommissionRate: Number(fareRule.platformCommissionRate),
      tenantCommissionRate: Number(fareRule.tenantCommissionRate),
    },
  });

  const ride = await prisma.ride.create({
    data: {
      tenantId: passenger.tenantId,
      passengerId: passenger.id,
      vehicleCategoryId: category.id,
      status: "SEARCHING_DRIVER",
      originAddress: parsed.originAddress,
      originLat: parsed.originLat.toFixed(7),
      originLng: parsed.originLng.toFixed(7),
      destinationAddress: parsed.destinationAddress,
      destinationLat: parsed.destinationLat.toFixed(7),
      destinationLng: parsed.destinationLng.toFixed(7),
      estimatedDistanceKm: parsed.estimatedDistanceKm.toFixed(2),
      estimatedDurationMin: parsed.estimatedDurationMin,
      estimatedPrice: estimate.total.toFixed(2),
      platformCommission: estimate.platformCommission.toFixed(2),
      tenantCommission: estimate.tenantCommission.toFixed(2),
      paymentMethod: parsed.paymentMethod,
      statusHistory: {
        create: [
          {
            tenantId: passenger.tenantId,
            to: "REQUESTED",
            createdBy: userId,
            reason: "Corrida solicitada pelo passageiro.",
          },
          {
            tenantId: passenger.tenantId,
            from: "REQUESTED",
            to: "SEARCHING_DRIVER",
            createdBy: userId,
            reason: "Busca inicial de motoristas iniciada.",
          },
        ],
      },
    },
    include: {
      vehicleCategory: true,
      passenger: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  await createInAppNotification({
    tenantId: ride.tenantId,
    userId,
    title: "Corrida solicitada",
    body: `Estamos buscando motorista para ${ride.destinationAddress}.`,
    metadata: buildRideNotificationMetadata({
      rideId: ride.id,
      status: ride.status,
      event: "RIDE_CREATED",
    }),
  });

  return ride;
}
