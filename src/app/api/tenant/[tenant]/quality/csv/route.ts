import { requireTenantRole } from "@/server/auth/session";
import {
  buildTenantQualityCsv,
  getTenantQualityReport,
} from "@/server/quality/tenant-quality";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/quality/csv">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const searchParams = new URL(request.url).searchParams;
  const report = await getTenantQualityReport(tenant, {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
  const csv = buildTenantQualityCsv(report);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zapmobili-${tenant}-qualidade.csv"`,
    },
  });
}
