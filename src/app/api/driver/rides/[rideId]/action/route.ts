import { z } from "zod";
import { requireAnyRole } from "@/server/auth/session";
import {
  advanceDriverRide,
  driverRideActions,
} from "@/server/drivers/calls";

const actionSchema = z.object({
  action: z.enum(driverRideActions),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/driver/rides/[rideId]/action">,
) {
  const session = await requireAnyRole(["DRIVER"]);
  const { rideId } = await context.params;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Acao invalida para a corrida." },
      { status: 400 },
    );
  }

  try {
    const ride = await advanceDriverRide(session.sub, rideId, parsed.data.action);

    return Response.json({
      ride: {
        id: ride.id,
        status: ride.status,
        passenger: ride.passenger.user.name,
        driver: ride.driver?.user.name,
        finalPrice: ride.finalPrice ? Number(ride.finalPrice) : null,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a corrida.",
      },
      { status: 400 },
    );
  }
}
