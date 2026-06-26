import { requireTenantRole } from "@/server/auth/session";
import {
  driverDecisionSchema,
  updateTenantDriverStatus,
} from "@/server/drivers/operations";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/drivers/[driverId]/status">,
) {
  const { tenant, driverId } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const body = await request.json();
  const parsed = driverDecisionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Status invalido para o motorista." },
      { status: 400 },
    );
  }

  try {
    const driver = await updateTenantDriverStatus(
      tenant,
      driverId,
      parsed.data.status,
    );

    return Response.json({
      driver: {
        id: driver.id,
        name: driver.user.name,
        email: driver.user.email,
        status: driver.status,
        availability: driver.availability,
        approvedAt: driver.approvedAt,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar motorista.",
      },
      { status: 400 },
    );
  }
}
