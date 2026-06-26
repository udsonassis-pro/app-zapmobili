import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertCanDispatchDriver } from "@/server/dispatch/dispatch-rules";
import {
  buildRideNotificationMetadata,
  createManyInAppNotifications,
} from "@/server/notifications/in-app";
import { assertRideTransition } from "@/server/rides/status";

export const assignRideSchema = z.object({
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
});

export const cancelRideSchema = z.object({
  reason: z.string().min(5).max(300),
});

export type AssignRideInput = z.infer<typeof assignRideSchema>;
export type CancelRideInput = z.infer<typeof cancelRideSchema>;

export async function listTenantDispatchBoard(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const [rides, drivers] = await Promise.all([
    prisma.ride.findMany({
      where: {
        tenantId: tenant.id,
        status: {
          in: [
            "SEARCHING_DRIVER",
            "DRIVER_ASSIGNED",
            "DRIVER_ARRIVING",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
          ],
        },
      },
      orderBy: { requestedAt: "asc" },
      include: {
        passenger: { include: { user: { select: { name: true, email: true } } } },
        driver: { include: { user: { select: { name: true } } } },
        vehicle: true,
        vehicleCategory: true,
      },
    }),
    prisma.driverProfile.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        status: "APPROVED",
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        vehicles: {
          where: { deletedAt: null, status: "APPROVED" },
          orderBy: { createdAt: "asc" },
          include: { category: true },
        },
      },
    }),
  ]);

  return { tenant, rides, drivers };
}

export async function assignTenantRide(
  tenantSlug: string,
  rideId: string,
  input: AssignRideInput,
  assignedByUserId: string,
) {
  const parsed = assignRideSchema.parse(input);
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const assignedRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: {
        id: rideId,
        tenantId: tenant.id,
        status: "SEARCHING_DRIVER",
        driverId: null,
      },
    });

    if (!ride) {
      throw new Error("Corrida indisponivel para despacho.");
    }

    const driver = await tx.driverProfile.findFirst({
      where: {
        id: parsed.driverId,
        tenantId: tenant.id,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, name: true } },
        vehicles: {
          where: { deletedAt: null },
        },
      },
    });

    if (!driver) {
      throw new Error("Motorista nao encontrado para este tenant.");
    }

    const vehicle = driver.vehicles.find(
      (driverVehicle) => driverVehicle.id === parsed.vehicleId,
    );

    if (!vehicle || vehicle.tenantId !== tenant.id) {
      throw new Error("Veiculo nao encontrado para este motorista.");
    }

    assertCanDispatchDriver({
      driverStatus: driver.status,
      availability: driver.availability,
      hasApprovedVehicleForCategory:
        vehicle.status === "APPROVED" &&
        vehicle.categoryId === ride.vehicleCategoryId,
    });
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
            createdBy: assignedByUserId,
            reason: "Corrida despachada manualmente pelo tenant.",
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

    await tx.driverProfile.update({
      where: { id: driver.id },
      data: { availability: "BUSY" },
    });

    return updatedRide;
  });

  await createManyInAppNotifications([
    {
      tenantId: assignedRide.tenantId,
      userId: assignedRide.passenger.user.id,
      title: "Motorista definido",
      body: `${assignedRide.driver?.user.name ?? "Motorista"} foi atribuido a sua corrida.`,
      metadata: buildRideNotificationMetadata({
        rideId: assignedRide.id,
        status: assignedRide.status,
        event: "RIDE_ASSIGNED_PASSENGER",
      }),
    },
    ...(assignedRide.driver?.user.id
      ? [
          {
            tenantId: assignedRide.tenantId,
            userId: assignedRide.driver.user.id,
            title: "Nova corrida atribuida",
            body: `Corrida de ${assignedRide.passenger.user.name} foi atribuida a voce.`,
            metadata: buildRideNotificationMetadata({
              rideId: assignedRide.id,
              status: assignedRide.status,
              event: "RIDE_ASSIGNED_DRIVER",
            }),
          },
        ]
      : []),
  ]);

  return assignedRide;
}

export async function cancelTenantRide(
  tenantSlug: string,
  rideId: string,
  input: CancelRideInput,
  canceledByUserId: string,
) {
  const parsed = cancelRideSchema.parse(input);
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const canceledRide = await prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findFirst({
      where: {
        id: rideId,
        tenantId: tenant.id,
        status: {
          in: [
            "SEARCHING_DRIVER",
            "DRIVER_ASSIGNED",
            "DRIVER_ARRIVING",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
          ],
        },
      },
      include: {
        passenger: { include: { user: { select: { id: true, name: true } } } },
        driver: { include: { user: { select: { id: true, name: true } } } },
        vehicle: true,
        vehicleCategory: true,
      },
    });

    if (!ride) {
      throw new Error("Corrida indisponivel para cancelamento.");
    }

    assertRideTransition(ride.status, "CANCELED_BY_SYSTEM");

    const updatedRide = await tx.ride.update({
      where: { id: ride.id },
      data: {
        status: "CANCELED_BY_SYSTEM",
        canceledAt: new Date(),
        cancelReason: parsed.reason,
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: ride.status,
            to: "CANCELED_BY_SYSTEM",
            createdBy: canceledByUserId,
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
    {
      tenantId: canceledRide.tenantId,
      userId: canceledRide.passenger.user.id,
      title: "Corrida cancelada",
      body: canceledRide.cancelReason ?? "Sua corrida foi cancelada.",
      metadata: buildRideNotificationMetadata({
        rideId: canceledRide.id,
        status: canceledRide.status,
        event: "RIDE_CANCELED_PASSENGER",
      }),
    },
    ...(canceledRide.driver?.user.id
      ? [
          {
            tenantId: canceledRide.tenantId,
            userId: canceledRide.driver.user.id,
            title: "Corrida cancelada",
            body: canceledRide.cancelReason ?? "A corrida foi cancelada.",
            metadata: buildRideNotificationMetadata({
              rideId: canceledRide.id,
              status: canceledRide.status,
              event: "RIDE_CANCELED_DRIVER",
            }),
          },
        ]
      : []),
  ]);

  return canceledRide;
}
