import { requireTenantRole } from "@/server/auth/session";
import { listTenantDriverOperations } from "@/server/drivers/operations";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/drivers/operations">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const result = await listTenantDriverOperations(tenant);

  return Response.json({
    drivers: result.drivers.map((driver) => ({
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      status: driver.status,
      availability: driver.availability,
      approvedAt: driver.approvedAt,
      approvedDocuments: driver.documents.filter(
        (document) => document.status === "APPROVED",
      ).length,
      pendingDocuments: driver.documents.filter(
        (document) => document.status === "PENDING",
      ).length,
      approvedVehicles: driver.vehicles.filter(
        (vehicle) => vehicle.status === "APPROVED",
      ).length,
      vehicles: driver.vehicles.map((vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.brand} ${vehicle.model}`,
        plate: vehicle.plate,
        status: vehicle.status,
        category: vehicle.category.name,
      })),
    })),
  });
}
