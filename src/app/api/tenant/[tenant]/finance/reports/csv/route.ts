import { requireTenantRole } from "@/server/auth/session";
import {
  buildTenantFinanceCsv,
  getTenantFinanceReport,
} from "@/server/payments/tenant-reports";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/finance/reports/csv">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const searchParams = new URL(request.url).searchParams;
  const report = await getTenantFinanceReport(tenant, {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
  const csv = buildTenantFinanceCsv(report);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zapmobili-${tenant}-financeiro.csv"`,
    },
  });
}
