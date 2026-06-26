import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertCanApproveDriver } from "@/server/drivers/operational-rules";

export const driverDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]),
});

export const vehicleDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "INACTIVE", "PENDING"]),
});

export async function listTenantDriverOperations(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const drivers = await prisma.driverProfile.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      vehicles: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { category: true },
      },
    },
  });

  return { tenant, drivers };
}

export async function updateTenantDriverStatus(
  tenantSlug: string,
  driverId: string,
  status: z.infer<typeof driverDecisionSchema>["status"],
) {
  const { tenant } = await listTenantDriverOperations(tenantSlug);
  const driver = await prisma.driverProfile.findFirst({
    where: { id: driverId, tenantId: tenant.id, deletedAt: null },
    include: {
      documents: true,
      vehicles: { where: { deletedAt: null } },
    },
  });

  if (!driver) {
    throw new Error("Motorista nao encontrado.");
  }

  if (status === "APPROVED") {
    assertCanApproveDriver({
      approvedDocuments: driver.documents.filter(
        (document) => document.status === "APPROVED",
      ).length,
      approvedVehicles: driver.vehicles.filter(
        (vehicle) => vehicle.status === "APPROVED",
      ).length,
    });
  }

  return prisma.driverProfile.update({
    where: { id: driver.id },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : null,
      availability: status === "APPROVED" ? driver.availability : "OFFLINE",
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

export async function updateTenantVehicleStatus(
  tenantSlug: string,
  vehicleId: string,
  status: z.infer<typeof vehicleDecisionSchema>["status"],
) {
  const { tenant } = await listTenantDriverOperations(tenantSlug);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, tenantId: tenant.id, deletedAt: null },
  });

  if (!vehicle) {
    throw new Error("Veiculo nao encontrado.");
  }

  return prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { status },
    include: {
      driver: { include: { user: { select: { name: true, email: true } } } },
      category: true,
    },
  });
}
