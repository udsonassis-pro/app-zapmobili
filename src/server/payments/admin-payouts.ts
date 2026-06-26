import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  calculateWalletAfterPayoutApproval,
  calculateWalletAfterPayoutRejection,
} from "@/server/payments/wallet-calculations";

export const payoutDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});

export type PayoutDecisionInput = z.infer<typeof payoutDecisionSchema>;

export async function listTenantPayouts(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const payouts = await prisma.driverPayout.findMany({
    where: { tenantId: tenant.id },
    orderBy: { requestedAt: "desc" },
    take: 50,
    include: {
      driver: {
        include: {
          user: { select: { name: true, email: true } },
          wallet: true,
        },
      },
    },
  });

  return { tenant, payouts };
}

export async function decideTenantPayout(
  tenantSlug: string,
  payoutId: string,
  input: PayoutDecisionInput,
) {
  const parsed = payoutDecisionSchema.parse(input);
  const { tenant } = await listTenantPayouts(tenantSlug);

  return prisma.$transaction(async (tx) => {
    const payout = await tx.driverPayout.findFirst({
      where: {
        id: payoutId,
        tenantId: tenant.id,
        status: "REQUESTED",
      },
      include: {
        driver: { include: { wallet: true } },
      },
    });

    if (!payout) {
      throw new Error("Repasse solicitado nao encontrado.");
    }

    const wallet = payout.driver.wallet;

    if (!wallet) {
      throw new Error("Carteira do motorista nao encontrada.");
    }

    const amount = Number(payout.amount);
    const nextWallet =
      parsed.decision === "APPROVE"
        ? calculateWalletAfterPayoutApproval({
            balance: Number(wallet.balance),
            blockedAmount: Number(wallet.blockedAmount),
            amount,
          })
        : calculateWalletAfterPayoutRejection({
            balance: Number(wallet.balance),
            blockedAmount: Number(wallet.blockedAmount),
            amount,
          });

    const updatedPayout = await tx.driverPayout.update({
      where: { id: payout.id },
      data: {
        status: parsed.decision === "APPROVE" ? "PAID" : "REJECTED",
        paidAt: parsed.decision === "APPROVE" ? new Date() : null,
        metadata: {
          decision: parsed.decision,
          note: parsed.note ?? null,
        },
      },
      include: {
        driver: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: nextWallet.balance.toFixed(2),
        blockedAmount: nextWallet.blockedAmount.toFixed(2),
      },
    });

    await tx.walletTransaction.create({
      data: {
        tenantId: payout.tenantId,
        walletId: wallet.id,
        type: "ADJUSTMENT",
        amount: "0.00",
        description:
          parsed.decision === "APPROVE"
            ? "Repasse aprovado e saldo baixado."
            : "Repasse rejeitado e saldo desbloqueado.",
      },
    });

    return updatedPayout;
  });
}
