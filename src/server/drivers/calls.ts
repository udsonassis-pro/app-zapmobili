import { prisma } from "@/lib/prisma";
import {
  buildRideNotificationMetadata,
  createInAppNotification,
  createManyInAppNotifications,
} from "@/server/notifications/in-app";
import { processCompletedRidePayment } from "@/server/payments/ride-financials";
import { assertRideTransition, type RideStatus } from "@/server/rides/status";

export const driverRideActions = [
  "START_TO_PICKUP",
  "MARK_ARRIVED",
  "START_RIDE",
  "COMPLETE_RIDE",
] as const;

export type DriverRideAction = (typeof driverRideActions)[number];

const actionTargets: Record<DriverRideAction, RideStatus> = {
  START_TO_PICKUP: "DRIVER_ARRIVING",
  MARK_ARRIVED: "DRIVER_ARRIVED",
  START_RIDE: "IN_PROGRESS",
  COMPLETE_RIDE: "COMPLETED",
};

const actionReasons: Record<DriverRideAction, string> = {
  START_TO_PICKUP: "Motorista iniciou deslocamento ate o passageiro.",
  MARK_ARRIVED: "Motorista informou chegada ao local de embarque.",
  START_RIDE: "Motorista iniciou a corrida.",
  COMPLETE_RIDE: "Motorista finalizou a corrida.",
};

export async function getDriverProfileForUser(userId: string) {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      vehicles: {
        where: { status: "APPROVED", deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      wallet: true,
    },
  });

  if (!driver || driver.deletedAt) {
    throw new Error("Perfil de motorista nao encontrado.");
  }

  return driver;
}

export async function listDriverCalls(userId: string) {
  const driver = await getDriverProfileForUser(userId);

  if (driver.status !== "APPROVED" || driver.availability !== "ONLINE") {
    return {
      driver,
      calls: [],
    };
  }

  const calls = await prisma.ride.findMany({
    where: {
      tenantId: driver.tenantId,
      status: "SEARCHING_DRIVER",
      driverId: null,
      vehicleCategoryId: {
        in: driver.vehicles.map((vehicle) => vehicle.categoryId),
      },
      driverDeclines: {
        none: { driverId: driver.id },
      },
    },
    orderBy: { requestedAt: "asc" },
    take: 10,
    include: {
      passenger: {
        include: {
          user: { select: { name: true } },
        },
      },
      vehicleCategory: true,
    },
  });

  return {
    driver,
    calls,
  };
}

export async function getDriverWorkboard(userId: string) {
  const { driver, calls } = await listDriverCalls(userId);
  const [activeRide, payouts, documents] = await Promise.all([
    prisma.ride.findFirst({
      where: {
        tenantId: driver.tenantId,
        driverId: driver.id,
        status: {
          in: [
            "DRIVER_ASSIGNED",
            "DRIVER_ARRIVING",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
          ],
        },
      },
      orderBy: { acceptedAt: "desc" },
      include: {
        passenger: {
          include: {
            user: { select: { name: true } },
          },
        },
        vehicle: true,
        vehicleCategory: true,
      },
    }),
    prisma.driverPayout.findMany({
      where: { driverId: driver.id },
      orderBy: { requestedAt: "desc" },
      take: 6,
    }),
    prisma.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    driver,
    calls,
    activeRide,
    payouts,
    documents,
  };
}

export async function acceptRideCall(userId: string, rideId: string) {
  const driver = await getDriverProfileForUser(userId);
  const vehicle = driver.vehicles[0];

  if (driver.status !== "APPROVED") {
    throw new Error("Motorista ainda nao aprovado.");
  }

  if (driver.availability !== "ONLINE") {
    throw new Error("Motorista precisa estar online para aceitar corrida.");
  }

  if (!vehicle) {
    throw new Error("Motorista nao possui veiculo aprovado.");
  }

  const updatedRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: {
        id: rideId,
        tenantId: driver.tenantId,
        status: "SEARCHING_DRIVER",
        driverId: null,
        vehicleCategoryId: vehicle.categoryId,
      },
    });

    if (!ride) {
      throw new Error("Corrida indisponivel para aceite.");
    }

    assertRideTransition(ride.status, "DRIVER_ASSIGNED");

    const updatedRide = await tx.ride.update({
      where: { id: ride.id },
      data: {
        driverId: driver.id,
        vehicleId: vehicle.id,
        status: "DRIVER_ASSIGNED",
        acceptedAt: new Date(),
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: ride.status,
            to: "DRIVER_ASSIGNED",
            createdBy: userId,
            reason: "Motorista aceitou a chamada.",
          },
        },
      },
      include: {
        passenger: {
          include: { user: { select: { id: true, name: true } } },
        },
        driver: {
          include: { user: { select: { id: true, name: true } } },
        },
        vehicle: true,
      },
    });

    await tx.driverProfile.update({
      where: { id: driver.id },
      data: { availability: "BUSY" },
    });

    return updatedRide;
  });

  await createManyInAppNotifications([
    {
      tenantId: updatedRide.tenantId,
      userId: updatedRide.passenger.user.id,
      title: "Motorista aceitou sua corrida",
      body: `${updatedRide.driver?.user.name ?? "Motorista"} esta a caminho.`,
      metadata: buildRideNotificationMetadata({
        rideId: updatedRide.id,
        status: updatedRide.status,
        event: "RIDE_ACCEPTED_PASSENGER",
      }),
    },
    {
      tenantId: updatedRide.tenantId,
      userId,
      title: "Corrida aceita",
      body: `Voce aceitou a corrida de ${updatedRide.passenger.user.name}.`,
      metadata: buildRideNotificationMetadata({
        rideId: updatedRide.id,
        status: updatedRide.status,
        event: "RIDE_ACCEPTED_DRIVER",
      }),
    },
  ]);

  return updatedRide;
}

export async function declineRideCall(userId: string, rideId: string) {
  const driver = await getDriverProfileForUser(userId);

  if (driver.status !== "APPROVED") {
    throw new Error("Motorista ainda nao aprovado.");
  }

  if (driver.availability !== "ONLINE") {
    throw new Error("Motorista precisa estar online para recusar chamada.");
  }

  const declinedRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: {
        id: rideId,
        tenantId: driver.tenantId,
        status: "SEARCHING_DRIVER",
        driverId: null,
        vehicleCategoryId: {
          in: driver.vehicles.map((vehicle) => vehicle.categoryId),
        },
      },
      include: {
        passenger: {
          include: { user: { select: { id: true, name: true } } },
        },
        vehicleCategory: true,
      },
    });

    if (!ride) {
      throw new Error("Corrida indisponivel para recusa.");
    }

    await tx.driverRideDecline.upsert({
      where: {
        rideId_driverId: {
          rideId: ride.id,
          driverId: driver.id,
        },
      },
      update: {
        reason: "Motorista recusou a chamada.",
      },
      create: {
        tenantId: ride.tenantId,
        rideId: ride.id,
        driverId: driver.id,
        reason: "Motorista recusou a chamada.",
      },
    });

    return ride;
  });

  await createInAppNotification({
    tenantId: declinedRide.tenantId,
    userId,
    title: "Chamada recusada",
    body: `Voce recusou a chamada de ${declinedRide.passenger.user.name}.`,
    metadata: buildRideNotificationMetadata({
      rideId: declinedRide.id,
      status: declinedRide.status,
      event: "RIDE_DECLINED_DRIVER",
    }),
  });

  return declinedRide;
}

export async function advanceDriverRide(
  userId: string,
  rideId: string,
  action: DriverRideAction,
) {
  const driver = await getDriverProfileForUser(userId);
  const targetStatus = actionTargets[action];

  if (!targetStatus) {
    throw new Error("Acao de corrida invalida.");
  }

  const updatedRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: {
        id: rideId,
        tenantId: driver.tenantId,
        driverId: driver.id,
      },
    });

    if (!ride) {
      throw new Error("Corrida nao encontrada para este motorista.");
    }

    assertRideTransition(ride.status, targetStatus);

    const now = new Date();
    const updatedRide = await tx.ride.update({
      where: { id: ride.id },
      data: {
        status: targetStatus,
        startedAt: targetStatus === "IN_PROGRESS" ? now : ride.startedAt,
        completedAt: targetStatus === "COMPLETED" ? now : ride.completedAt,
        finalDistanceKm:
          targetStatus === "COMPLETED"
            ? ride.estimatedDistanceKm
            : ride.finalDistanceKm,
        finalDurationMin:
          targetStatus === "COMPLETED"
            ? ride.estimatedDurationMin
            : ride.finalDurationMin,
        finalPrice:
          targetStatus === "COMPLETED" ? ride.estimatedPrice : ride.finalPrice,
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: ride.status,
            to: targetStatus,
            createdBy: userId,
            reason: actionReasons[action],
          },
        },
      },
      include: {
        passenger: {
          include: { user: { select: { id: true, name: true } } },
        },
        driver: {
          include: { user: { select: { id: true, name: true } } },
        },
        vehicle: true,
      },
    });

    if (targetStatus === "COMPLETED") {
      await tx.driverProfile.update({
        where: { id: driver.id },
        data: { availability: "ONLINE" },
      });
    }

    return updatedRide;
  });

  if (targetStatus === "COMPLETED") {
    const financialResult = await processCompletedRidePayment(
      updatedRide.id,
      userId,
    );
    return financialResult.ride;
  }

  if (targetStatus === "DRIVER_ARRIVING") {
    await createInAppNotification({
      tenantId: updatedRide.tenantId,
      userId: updatedRide.passenger.user.id,
      title: "Motorista a caminho",
      body: `${updatedRide.driver?.user.name ?? "Motorista"} iniciou o deslocamento.`,
      metadata: buildRideNotificationMetadata({
        rideId: updatedRide.id,
        status: updatedRide.status,
        event: "DRIVER_ARRIVING",
      }),
    });
  }

  return updatedRide;
}
