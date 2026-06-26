import { requireAnyRole } from "@/server/auth/session";
import { acceptRideCall } from "@/server/drivers/calls";

export async function POST(_request: Request, context: RouteContext<"/api/driver/calls/[rideId]/accept">) {
  const session = await requireAnyRole(["DRIVER"]);
  const { rideId } = await context.params;

  try {
    const ride = await acceptRideCall(session.sub, rideId);

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
            : "Nao foi possivel aceitar a corrida.",
      },
      { status: 400 },
    );
  }
}
