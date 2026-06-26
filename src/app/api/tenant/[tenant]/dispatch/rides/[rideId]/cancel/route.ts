import { requireTenantRole } from "@/server/auth/session";
import {
  cancelRideSchema,
  cancelTenantRide,
} from "@/server/dispatch/dispatch";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/dispatch/rides/[rideId]/cancel">,
) {
  const { tenant, rideId } = await context.params;
  const session = await requireTenantRole(tenant, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const body = await request.json();
  const parsed = cancelRideSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Informe um motivo de cancelamento com pelo menos 5 caracteres." },
      { status: 400 },
    );
  }

  try {
    const ride = await cancelTenantRide(
      tenant,
      rideId,
      parsed.data,
      session.sub,
    );

    return Response.json({
      ride: {
        id: ride.id,
        status: ride.status,
        passenger: ride.passenger.user.name,
        driver: ride.driver?.user.name ?? null,
        cancelReason: ride.cancelReason,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel cancelar corrida.",
      },
      { status: 400 },
    );
  }
}
