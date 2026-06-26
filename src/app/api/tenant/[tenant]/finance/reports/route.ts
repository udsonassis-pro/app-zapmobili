import { requireTenantRole } from "@/server/auth/session";
import { getTenantFinanceReport } from "@/server/payments/tenant-reports";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/finance/reports">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const searchParams = new URL(request.url).searchParams;
  const report = await getTenantFinanceReport(tenant, {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  return Response.json({
    totals: report.totals,
    byMethod: report.byMethod.map((item) => ({
      method: item.method,
      count: item._count._all,
      amount: Number(item._sum.amount ?? 0),
    })),
    payments: report.payments.map((payment) => ({
      id: payment.id,
      rideId: payment.rideId,
      paidAt: payment.paidAt,
      method: payment.method,
      status: payment.status,
      amount: Number(payment.amount),
      passenger: payment.ride.passenger.user.name,
      driver: payment.ride.driver?.user.name ?? null,
    })),
  });
}
