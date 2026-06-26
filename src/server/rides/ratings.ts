import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRideNotificationMetadata,
  createInAppNotification,
} from "@/server/notifications/in-app";
import { canUserRateRide } from "@/server/rides/detail-format";

export const submitRideRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type SubmitRideRatingInput = z.infer<typeof submitRideRatingSchema>;

async function updateDriverRating(driverId: string) {
  const aggregate = await prisma.rating.aggregate({
    where: { driverId },
    _avg: { score: true },
  });

  await prisma.driverProfile.update({
    where: { id: driverId },
    data: { rating: aggregate._avg.score ?? 5 },
  });
}

async function updatePassengerRating(passengerId: string) {
  const aggregate = await prisma.rating.aggregate({
    where: { passengerId },
    _avg: { score: true },
  });

  await prisma.passengerProfile.update({
    where: { id: passengerId },
    data: { rating: aggregate._avg.score ?? 5 },
  });
}

export async function submitRideRating(
  userId: string,
  rideId: string,
  input: SubmitRideRatingInput,
) {
  const parsed = submitRideRatingSchema.parse(input);
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

  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        user.passengerProfile
          ? { passengerId: user.passengerProfile.id }
          : undefined,
        user.driverProfile ? { driverId: user.driverProfile.id } : undefined,
      ].filter((filter): filter is { passengerId: string } | { driverId: string } =>
        Boolean(filter),
      ),
    },
    include: {
      passenger: { include: { user: { select: { id: true, name: true } } } },
      driver: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  const viewerRole =
    user.driverProfile?.id === ride.driverId ? "DRIVER" : "PASSENGER";
  const targetDriverId = viewerRole === "PASSENGER" ? ride.driverId : null;
  const targetPassengerId =
    viewerRole === "DRIVER" ? ride.passengerId : null;

  const existingRating = await prisma.rating.findFirst({
    where: {
      rideId: ride.id,
      ...(targetDriverId ? { driverId: targetDriverId } : {}),
      ...(targetPassengerId ? { passengerId: targetPassengerId } : {}),
    },
  });

  if (
    !canUserRateRide({
      status: ride.status,
      hasTarget: Boolean(targetDriverId ?? targetPassengerId),
      alreadyRated: Boolean(existingRating),
    })
  ) {
    throw new Error("Avaliacao indisponivel para esta corrida.");
  }

  const rating = await prisma.rating.create({
    data: {
      tenantId: ride.tenantId,
      rideId: ride.id,
      driverId: targetDriverId,
      passengerId: targetPassengerId,
      score: parsed.score,
      comment: parsed.comment?.trim() || null,
    },
  });

  if (targetDriverId) {
    await updateDriverRating(targetDriverId);
    await createInAppNotification({
      tenantId: ride.tenantId,
      userId: ride.driver!.user.id,
      title: "Voce recebeu uma avaliacao",
      body: `${ride.passenger.user.name} avaliou sua corrida com ${rating.score} estrelas.`,
      metadata: buildRideNotificationMetadata({
        rideId: ride.id,
        status: ride.status,
        event: "RIDE_RATED_DRIVER",
      }),
    });
  }

  if (targetPassengerId) {
    await updatePassengerRating(targetPassengerId);
    await createInAppNotification({
      tenantId: ride.tenantId,
      userId: ride.passenger.user.id,
      title: "Voce recebeu uma avaliacao",
      body: `${ride.driver?.user.name ?? "Motorista"} avaliou sua corrida com ${rating.score} estrelas.`,
      metadata: buildRideNotificationMetadata({
        rideId: ride.id,
        status: ride.status,
        event: "RIDE_RATED_PASSENGER",
      }),
    });
  }

  return rating;
}
