import { requireTenantRole } from "@/server/auth/session";
import { publishTenantFareRule } from "@/server/pricing/admin-pricing";
import { publishFareRuleSchema } from "@/server/pricing/admin-schemas";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/pricing/categories/[categoryId]/fare-rules">,
) {
  const { tenant, categoryId } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const body = await request.json();
  const parsed = publishFareRuleSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para publicar tarifa." },
      { status: 400 },
    );
  }

  try {
    const fareRule = await publishTenantFareRule(tenant, categoryId, parsed.data);

    return Response.json({ fareRule }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel publicar tarifa.",
      },
      { status: 400 },
    );
  }
}
