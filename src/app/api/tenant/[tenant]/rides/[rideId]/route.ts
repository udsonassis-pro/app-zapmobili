import { requireTenantRole } from "@/server/auth/session";
import { getTenantRideDetails } from "@/server/rides/details";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/rides/[rideId]">,
) {
  const { tenant, rideId } = await context.params;
  await requireTenantRole(tenant, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
    "SUPPORT",
  ]);

  try {
    const result = await getTenantRideDetails(tenant, rideId);

    return Response.json({
      ride: {
        id: result.ride.id,
        status: result.ride.status,
        passenger: result.ride.passenger.user.name,
        driver: result.ride.driver?.user.name ?? null,
        vehicle: result.ride.vehicle
          ? `${result.ride.vehicle.brand} ${result.ride.vehicle.model} - ${result.ride.vehicle.plate}`
          : null,
        displayPrice: result.displayPrice,
        canCancel: result.canCancel,
        payments: result.ride.payments.length,
        timeline: result.ride.statusHistory.length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a corrida.",
      },
      { status: 404 },
    );
  }
}
