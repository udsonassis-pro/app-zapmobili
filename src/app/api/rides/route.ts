import { requireAnyRole } from "@/server/auth/session";
import { createRideRequest } from "@/server/rides/create-ride";
import { createRideRequestSchema } from "@/server/rides/create-ride-schema";

export async function POST(request: Request) {
  const session = await requireAnyRole(["PASSENGER"]);
  const body = await request.json();
  const parsed = createRideRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para solicitar corrida.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const ride = await createRideRequest(session.sub, parsed.data);

    return Response.json(
      {
        ride: {
          id: ride.id,
          status: ride.status,
          passenger: ride.passenger.user.name,
          category: ride.vehicleCategory.name,
          estimatedPrice: Number(ride.estimatedPrice),
          estimatedDistanceKm: Number(ride.estimatedDistanceKm),
          estimatedDurationMin: ride.estimatedDurationMin,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel solicitar a corrida.",
      },
      { status: 400 },
    );
  }
}
