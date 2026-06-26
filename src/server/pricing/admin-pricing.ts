import { prisma } from "@/lib/prisma";
import {
  createVehicleCategorySchema,
  publishFareRuleSchema,
  type CreateVehicleCategoryInput,
  type PublishFareRuleInput,
} from "@/server/pricing/admin-schemas";

export async function listTenantPricing(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const categories = await prisma.vehicleCategory.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
    include: {
      fareRules: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: { vehicles: true, rides: true },
      },
    },
  });

  return { tenant, categories };
}

export async function createTenantVehicleCategory(
  tenantSlug: string,
  input: CreateVehicleCategoryInput,
) {
  const parsed = createVehicleCategorySchema.parse(input);
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  return prisma.vehicleCategory.create({
    data: {
      tenantId: tenant.id,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      seats: parsed.seats,
      acceptsMoto: parsed.acceptsMoto,
      active: true,
    },
  });
}

export async function publishTenantFareRule(
  tenantSlug: string,
  categoryId: string,
  input: PublishFareRuleInput,
) {
  const parsed = publishFareRuleSchema.parse(input);
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const category = await prisma.vehicleCategory.findFirst({
    where: { id: categoryId, tenantId: tenant.id },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Categoria nao encontrada.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.fareRule.updateMany({
      where: {
        tenantId: tenant.id,
        vehicleCategoryId: category.id,
        active: true,
      },
      data: { active: false },
    });

    return tx.fareRule.create({
      data: {
        tenantId: tenant.id,
        vehicleCategoryId: category.id,
        name: parsed.name,
        baseFare: parsed.baseFare.toFixed(2),
        pricePerKm: parsed.pricePerKm.toFixed(2),
        pricePerMinute: parsed.pricePerMinute.toFixed(2),
        minimumFare: parsed.minimumFare.toFixed(2),
        cancellationFee: parsed.cancellationFee.toFixed(2),
        platformCommissionRate: parsed.platformCommissionRate.toFixed(4),
        tenantCommissionRate: parsed.tenantCommissionRate.toFixed(4),
        active: true,
      },
    });
  });
}
