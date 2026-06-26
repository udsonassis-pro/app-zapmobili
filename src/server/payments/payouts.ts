import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertPayoutAmount,
  calculateAvailableBalance,
} from "@/server/payments/wallet-calculations";

export const requestPayoutSchema = z.object({
  amount: z.number().positive(),
  pixKey: z.string().min(3).max(120).optional(),
});

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

export async function listDriverPayouts(userId: string) {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      wallet: true,
      payouts: {
        orderBy: { requestedAt: "desc" },
        take: 8,
      },
    },
  });

  if (!driver || driver.deletedAt) {
    throw new Error("Perfil de motorista nao encontrado.");
  }

  const wallet = driver.wallet;

  return {
    wallet,
    availableBalance: calculateAvailableBalance({
      balance: Number(wallet?.balance ?? 0),
      blockedAmount: Number(wallet?.blockedAmount ?? 0),
    }),
    payouts: driver.payouts,
  };
}

export async function requestDriverPayout(
  userId: string,
  input: RequestPayoutInput,
) {
  const parsed = requestPayoutSchema.parse(input);
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: { wallet: true },
  });

  if (!driver || driver.deletedAt) {
    throw new Error("Perfil de motorista nao encontrado.");
  }

  if (!driver.wallet) {
    throw new Error("Carteira do motorista nao encontrada.");
  }

  const availableBalance = calculateAvailableBalance({
    balance: Number(driver.wallet.balance),
    blockedAmount: Number(driver.wallet.blockedAmount),
  });

  assertPayoutAmount({
    amount: parsed.amount,
    availableBalance,
  });

  return prisma.$transaction(async (tx) => {
    const payout = await tx.driverPayout.create({
      data: {
        tenantId: driver.tenantId,
        driverId: driver.id,
        amount: parsed.amount.toFixed(2),
        status: "REQUESTED",
        metadata: {
          pixKey: parsed.pixKey ?? null,
        },
      },
    });

    await tx.wallet.update({
      where: { id: driver.wallet!.id },
      data: {
        blockedAmount: {
          increment: parsed.amount,
        },
      },
    });

    await tx.walletTransaction.create({
      data: {
        tenantId: driver.tenantId,
        walletId: driver.wallet!.id,
        type: "PAYOUT",
        amount: (-parsed.amount).toFixed(2),
        description: "Valor bloqueado para solicitacao de repasse.",
      },
    });

    return payout;
  });
}
