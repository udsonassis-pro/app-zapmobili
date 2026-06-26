import { requireTenantRole } from "@/server/auth/session";
import {
  createTenantVehicleCategory,
  listTenantPricing,
} from "@/server/pricing/admin-pricing";
import { createVehicleCategorySchema } from "@/server/pricing/admin-schemas";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/pricing/categories">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "FINANCE"]);
  const result = await listTenantPricing(tenant);

  return Response.json({
    categories: result.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      active: category.active,
      seats: category.seats,
      acceptsMoto: category.acceptsMoto,
      vehicles: category._count.vehicles,
      rides: category._count.rides,
      activeFareRule:
        category.fareRules.find((fareRule) => fareRule.active) ?? null,
    })),
  });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/pricing/categories">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "FINANCE"]);
  const body = await request.json();
  const parsed = createVehicleCategorySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para criar categoria." },
      { status: 400 },
    );
  }

  try {
    const category = await createTenantVehicleCategory(tenant, parsed.data);

    return Response.json({ category }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel criar categoria.",
      },
      { status: 400 },
    );
  }
}
