import { requireTenantRole } from "@/server/auth/session";
import {
  updateTenantVehicleStatus,
  vehicleDecisionSchema,
} from "@/server/drivers/operations";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/vehicles/[vehicleId]/status">,
) {
  const { tenant, vehicleId } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const body = await request.json();
  const parsed = vehicleDecisionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Status invalido para o veiculo." },
      { status: 400 },
    );
  }

  try {
    const vehicle = await updateTenantVehicleStatus(
      tenant,
      vehicleId,
      parsed.data.status,
    );

    return Response.json({
      vehicle: {
        id: vehicle.id,
        label: `${vehicle.brand} ${vehicle.model}`,
        plate: vehicle.plate,
        status: vehicle.status,
        category: vehicle.category.name,
        driver: vehicle.driver.user.name,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar veiculo.",
      },
      { status: 400 },
    );
  }
}
