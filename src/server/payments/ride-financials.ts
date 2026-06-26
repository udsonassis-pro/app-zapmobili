import { prisma } from "@/lib/prisma";
import {
  buildRideNotificationMetadata,
  createManyInAppNotifications,
} from "@/server/notifications/in-app";
import { calculateDriverEarning } from "@/server/payments/financial-calculations";
import { getPaymentGateway } from "@/server/payments/gateway";
import { assertRideTransition } from "@/server/rides/status";

export async function processCompletedRidePayment(rideId: string, userId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      payments: true,
      driver: { include: { wallet: true } },
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  if (ride.status !== "COMPLETED") {
    throw new Error("A corrida precisa estar concluida para processar pagamento.");
  }

  if (!ride.driverId || !ride.driver) {
    throw new Error("Corrida sem motorista vinculado.");
  }

  const driver = ride.driver;
  const driverId = ride.driverId;

  if (ride.payments.some((payment) => payment.status === "PAID")) {
    throw new Error("Pagamento da corrida ja processado.");
  }

  const total = Number(ride.finalPrice ?? ride.estimatedPrice);
  const platformCommission = Number(ride.platformCommission ?? 0);
  const tenantCommission = Number(ride.tenantCommission ?? 0);
  const driverEarning = calculateDriverEarning({
    total,
    platformCommission,
    tenantCommission,
  });
  const gateway = getPaymentGateway();
  const gatewayResult = await gateway.charge({
    tenantId: ride.tenantId,
    rideId: ride.id,
    amount: total,
    method: ride.paymentMethod,
  });
  const paid = gatewayResult.status === "PAID";

  const result = await prisma.$transaction(async (tx) => {
    assertRideTransition("COMPLETED", "PAYMENT_PENDING");

    await tx.ride.update({
      where: { id: ride.id },
      data: {
        status: "PAYMENT_PENDING",
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: "COMPLETED",
            to: "PAYMENT_PENDING",
            createdBy: userId,
            reason: "Processamento financeiro iniciado.",
          },
        },
      },
    });

    const payment = await tx.payment.create({
      data: {
        tenantId: ride.tenantId,
        rideId: ride.id,
        provider: gatewayResult.provider,
        providerRef: gatewayResult.providerRef,
        method: ride.paymentMethod,
        status: gatewayResult.status,
        amount: gatewayResult.amount.toFixed(2),
        paidAt: paid ? new Date() : null,
        metadata: {
          platformCommission,
          tenantCommission,
          driverEarning,
        },
      },
    });

    if (!paid) {
      const pendingRide = await tx.ride.findUniqueOrThrow({
        where: { id: ride.id },
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

      return { ride: pendingRide, payment, driverEarning: 0 };
    }

    assertRideTransition("PAYMENT_PENDING", "PAID");

    const wallet = driver.wallet
      ? driver.wallet
      : await tx.wallet.create({
          data: {
            tenantId: ride.tenantId,
            driverId,
          },
        });

    await tx.walletTransaction.create({
      data: {
        tenantId: ride.tenantId,
        walletId: wallet.id,
        rideId: ride.id,
        type: "RIDE_EARNING",
        amount: driverEarning.toFixed(2),
        description: "Ganho liquido da corrida.",
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: driverEarning,
        },
      },
    });

    const paidRide = await tx.ride.update({
      where: { id: ride.id },
      data: {
        status: "PAID",
        statusHistory: {
          create: {
            tenantId: ride.tenantId,
            from: "PAYMENT_PENDING",
            to: "PAID",
            createdBy: userId,
            reason: "Pagamento aprovado e carteira creditada.",
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

    return { ride: paidRide, payment, driverEarning };
  });

  if (result.ride.status !== "PAID") {
    return result;
  }

  await createManyInAppNotifications([
    {
      tenantId: result.ride.tenantId,
      userId: result.ride.passenger.user.id,
      title: "Corrida finalizada",
      body: "Pagamento aprovado e corrida finalizada.",
      metadata: buildRideNotificationMetadata({
        rideId: result.ride.id,
        status: result.ride.status,
        event: "RIDE_PAID_PASSENGER",
      }),
    },
    ...(result.ride.driver?.user.id
      ? [
          {
            tenantId: result.ride.tenantId,
            userId: result.ride.driver.user.id,
            title: "Ganho creditado",
            body: `Ganho liquido de R$ ${result.driverEarning.toFixed(2).replace(".", ",")} creditado.`,
            metadata: buildRideNotificationMetadata({
              rideId: result.ride.id,
              status: result.ride.status,
              event: "RIDE_PAID_DRIVER",
            }),
          },
        ]
      : []),
  ]);

  return result;
}
