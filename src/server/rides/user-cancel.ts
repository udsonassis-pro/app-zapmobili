import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buildRideNotificationMetadata,
  createManyInAppNotifications,
} from "@/server/notifications/in-app";
import { assertRideTransition, type RideStatus } from "@/server/rides/status";

export const cancelUserRideSchema = z.object({
  reason: z.string().min(5).max(300),
});

export type CancelUserRideInput = z.infer<typeof cancelUserRideSchema>;

export async function cancelUserRide(
  userId: string,
  rideId: string,
  input: CancelUserRideInput,
) {
  const parsed = cancelUserRideSchema.parse(input);
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
      vehicle: true,
      vehicleCategory: true,
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  const viewerRole =
    user.driverProfile?.id === ride.driverId ? "DRIVER" : "PASSENGER";
  const targetStatus: RideStatus =
    viewerRole === "DRIVER" ? "CANCELED_BY_DRIVER" : "CANCELED_BY_PASSENGER";

  assertRideTransition(ride.status, targetStatus);

  const canceledRide = await prisma.$transaction(async (tx) => {
    const updatedRide = await tx.ride.update({
      where: { id: ride.id },
      data: {
        status: targetStatus,
        canceledAt: new Date(),
        cancelReason: parsed.reason,
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: ride.status,
            to: targetStatus,
            createdBy: userId,
            reason: parsed.reason,
          },
        },
      },
      include: {
        passenger: { include: { user: { select: { id: true, name: true } } } },
        driver: { include: { user: { select: { id: true, name: true } } } },
        vehicle: true,
        vehicleCategory: true,
      },
    });

    if (ride.driverId) {
      await tx.driverProfile.update({
        where: { id: ride.driverId },
        data: { availability: "ONLINE" },
      });
    }

    return updatedRide;
  });

  await createManyInAppNotifications([
    ...(viewerRole === "PASSENGER" && canceledRide.driver?.user.id
      ? [
          {
            tenantId: canceledRide.tenantId,
            userId: canceledRide.driver.user.id,
            title: "Corrida cancelada pelo passageiro",
            body: `${canceledRide.passenger.user.name} cancelou a corrida.`,
            metadata: buildRideNotificationMetadata({
              rideId: canceledRide.id,
              status: canceledRide.status,
              event: "RIDE_CANCELED_DRIVER",
            }),
          },
        ]
      : []),
    ...(viewerRole === "DRIVER"
      ? [
          {
            tenantId: canceledRide.tenantId,
            userId: canceledRide.passenger.user.id,
            title: "Corrida cancelada pelo motorista",
            body: `${canceledRide.driver?.user.name ?? "Motorista"} cancelou a corrida.`,
            metadata: buildRideNotificationMetadata({
              rideId: canceledRide.id,
              status: canceledRide.status,
              event: "RIDE_CANCELED_PASSENGER",
            }),
          },
        ]
      : []),
  ]);

  return canceledRide;
}
