import { requireTenantRole } from "@/server/auth/session";
import {
  assignRideSchema,
  assignTenantRide,
} from "@/server/dispatch/dispatch";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/dispatch/rides/[rideId]/assign">,
) {
  const { tenant, rideId } = await context.params;
  const session = await requireTenantRole(tenant, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const body = await request.json();
  const parsed = assignRideSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para despachar corrida." },
      { status: 400 },
    );
  }

  try {
    const ride = await assignTenantRide(
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
        driver: ride.driver?.user.name,
        vehicle: ride.vehicle
          ? `${ride.vehicle.brand} ${ride.vehicle.model} - ${ride.vehicle.plate}`
          : null,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel despachar corrida.",
      },
      { status: 400 },
    );
  }
}
