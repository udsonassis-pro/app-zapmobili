import { requireTenantRole } from "@/server/auth/session";
import { getTenantQualityReport } from "@/server/quality/tenant-quality";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/quality">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const searchParams = new URL(request.url).searchParams;
  const report = await getTenantQualityReport(tenant, {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  return Response.json({
    totals: report.totals,
    byScore: report.byScore.map((item) => ({
      score: item.score,
      count: item._count._all,
    })),
    drivers: report.drivers,
    recentComments: report.recentComments,
  });
}
