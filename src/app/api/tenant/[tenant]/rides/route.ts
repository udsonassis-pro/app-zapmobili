import { requireTenantRole } from "@/server/auth/session";
import { listTenantRideHistory } from "@/server/rides/history";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/rides">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
    "SUPPORT",
  ]);

  const searchParams = new URL(request.url).searchParams;
  const result = await listTenantRideHistory(tenant, {
    status: searchParams.get("status") || undefined,
    query: searchParams.get("query") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  return Response.json({
    total: result.total,
    rides: result.rides.map((ride) => ({
      id: ride.id,
      status: ride.status,
      passenger: ride.passenger.user.name,
      driver: ride.driver?.user.name ?? null,
      originAddress: ride.originAddress,
      destinationAddress: ride.destinationAddress,
      requestedAt: ride.requestedAt,
      estimatedPrice: Number(ride.estimatedPrice),
      finalPrice: ride.finalPrice === null ? null : Number(ride.finalPrice),
      category: ride.vehicleCategory.name,
      paymentStatus: ride.payments[0]?.status ?? null,
    })),
  });
}
