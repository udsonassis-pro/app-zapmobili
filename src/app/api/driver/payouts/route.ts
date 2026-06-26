import { requireAnyRole } from "@/server/auth/session";
import {
  listDriverPayouts,
  requestDriverPayout,
  requestPayoutSchema,
} from "@/server/payments/payouts";

export async function GET() {
  const session = await requireAnyRole(["DRIVER"]);
  const result = await listDriverPayouts(session.sub);

  return Response.json({
    wallet: {
      balance: Number(result.wallet?.balance ?? 0),
      blockedAmount: Number(result.wallet?.blockedAmount ?? 0),
      availableBalance: result.availableBalance,
    },
    payouts: result.payouts.map((payout) => ({
      id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      requestedAt: payout.requestedAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAnyRole(["DRIVER"]);
  const body = await request.json();
  const parsed = requestPayoutSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para solicitar repasse." },
      { status: 400 },
    );
  }

  try {
    const payout = await requestDriverPayout(session.sub, parsed.data);

    return Response.json(
      {
        payout: {
          id: payout.id,
          amount: Number(payout.amount),
          status: payout.status,
          requestedAt: payout.requestedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel solicitar repasse.",
      },
      { status: 400 },
    );
  }
}
