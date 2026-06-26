import { requireAnyRole } from "@/server/auth/session";
import { listDriverCalls } from "@/server/drivers/calls";

export async function GET() {
  const session = await requireAnyRole(["DRIVER"]);
  const { driver, calls } = await listDriverCalls(session.sub);

  return Response.json({
    driver: {
      id: driver.id,
      name: driver.user.name,
      availability: driver.availability,
      status: driver.status,
      balance: Number(driver.wallet?.balance ?? 0),
      rating: Number(driver.rating),
    },
    calls: calls.map((ride) => ({
      id: ride.id,
      passenger: ride.passenger.user.name,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      status: ride.status,
      category: ride.vehicleCategory.name,
      estimatedPrice: Number(ride.estimatedPrice),
      estimatedDistanceKm: Number(ride.estimatedDistanceKm),
      estimatedDurationMin: ride.estimatedDurationMin,
      requestedAt: ride.requestedAt,
    })),
  });
}
