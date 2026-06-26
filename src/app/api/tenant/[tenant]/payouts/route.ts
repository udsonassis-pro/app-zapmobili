import { requireTenantRole } from "@/server/auth/session";
import { listTenantPayouts } from "@/server/payments/admin-payouts";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/payouts">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const result = await listTenantPayouts(tenant);

  return Response.json({
    payouts: result.payouts.map((payout) => ({
      id: payout.id,
      driver: payout.driver.user.name,
      driverEmail: payout.driver.user.email,
      amount: Number(payout.amount),
      status: payout.status,
      requestedAt: payout.requestedAt,
      walletBalance: Number(payout.driver.wallet?.balance ?? 0),
      walletBlocked: Number(payout.driver.wallet?.blockedAmount ?? 0),
    })),
  });
}
