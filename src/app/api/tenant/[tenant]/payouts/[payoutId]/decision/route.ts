import { requireTenantRole } from "@/server/auth/session";
import {
  decideTenantPayout,
  payoutDecisionSchema,
} from "@/server/payments/admin-payouts";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/payouts/[payoutId]/decision">,
) {
  const { tenant, payoutId } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const body = await request.json();
  const parsed = payoutDecisionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Decisao invalida para o repasse." },
      { status: 400 },
    );
  }

  try {
    const payout = await decideTenantPayout(tenant, payoutId, parsed.data);

    return Response.json({
      payout: {
        id: payout.id,
        driver: payout.driver.user.name,
        amount: Number(payout.amount),
        status: payout.status,
        paidAt: payout.paidAt,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel decidir o repasse.",
      },
      { status: 400 },
    );
  }
}
