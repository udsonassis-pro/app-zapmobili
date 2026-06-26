import { requireAnyRole } from "@/server/auth/session";
import { declineRideCall } from "@/server/drivers/calls";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/driver/calls/[rideId]/decline">,
) {
  const session = await requireAnyRole(["DRIVER"]);
  const { rideId } = await context.params;

  try {
    const ride = await declineRideCall(session.sub, rideId);

    return Response.json({
      ride: {
        id: ride.id,
        status: ride.status,
        passenger: ride.passenger.user.name,
        category: ride.vehicleCategory.name,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel recusar a corrida.",
      },
      { status: 400 },
    );
  }
}
