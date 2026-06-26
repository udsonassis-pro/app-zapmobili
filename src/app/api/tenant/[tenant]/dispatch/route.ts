import { requireTenantRole } from "@/server/auth/session";
import { listTenantDispatchBoard } from "@/server/dispatch/dispatch";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/dispatch">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const result = await listTenantDispatchBoard(tenant);

  return Response.json({
    rides: result.rides.map((ride) => ({
      id: ride.id,
      status: ride.status,
      passenger: ride.passenger.user.name,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      estimatedPrice: Number(ride.estimatedPrice),
      requestedAt: ride.requestedAt,
      category: ride.vehicleCategory.name,
      driver: ride.driver?.user.name ?? null,
      vehicle: ride.vehicle
        ? `${ride.vehicle.brand} ${ride.vehicle.model} - ${ride.vehicle.plate}`
        : null,
    })),
    drivers: result.drivers.map((driver) => ({
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      availability: driver.availability,
      vehicles: driver.vehicles.map((vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
        categoryId: vehicle.categoryId,
        category: vehicle.category.name,
      })),
    })),
  });
}
