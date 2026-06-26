import { requireTenantRole } from "@/server/auth/session";
import { notifyTenantSupportSlaRisks } from "@/server/support/sla-alerts";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/support/sla-alerts">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const result = await notifyTenantSupportSlaRisks(tenant);

  return Response.json(result);
}
