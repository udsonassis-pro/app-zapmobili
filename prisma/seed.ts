import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const passwordHash = await bcrypt.hash("ZapMobili@123", 12);

  const plan = await prisma.subscriptionPlan.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      name: "Starter",
      slug: "starter",
      monthlyPrice: "499.00",
      maxDrivers: 50,
      maxRidesMonth: 3000,
      features: ["tenant-admin", "passenger-pwa", "driver-pwa", "mock-payments"],
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Zap Demo Transportes",
      slug: "demo",
      domain: "demo.zapmobili.com.br",
      status: "TRIAL",
      primaryColor: "#0f766e",
      accentColor: "#f59e0b",
      settings: {
        create: [
          {
            key: "support.whatsapp",
            value: "+55 11 90000-0000",
          },
          {
            key: "operation.city",
            value: "Sao Paulo",
          },
        ],
      },
      subscriptions: {
        create: {
          planId: plan.id,
          status: "TRIAL",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@zapmobili.com.br" },
    update: {},
    create: {
      name: "Admin Zap Mobili",
      email: "admin@zapmobili.com.br",
      passwordHash,
      roles: {
        create: {
          name: "SUPER_ADMIN",
          permissions: {
            create: [
              { action: "manage", subject: "Tenant" },
              { action: "manage", subject: "SubscriptionPlan" },
            ],
          },
        },
      },
    },
  });

  const passengerUser = await prisma.user.upsert({
    where: { email: "passageiro@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Ana Paula",
      email: "passageiro@demo.com",
      phone: "+55 11 98888-1111",
      passwordHash,
      roles: { create: { tenantId: tenant.id, name: "PASSENGER" } },
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "motorista@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Carlos Motorista",
      email: "motorista@demo.com",
      phone: "+55 11 97777-2222",
      passwordHash,
      roles: { create: { tenantId: tenant.id, name: "DRIVER" } },
    },
  });

  const passenger = await prisma.passengerProfile.upsert({
    where: { userId: passengerUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: passengerUser.id,
      document: "12345678900",
    },
  });

  const driver = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: driverUser.id,
      document: "98765432100",
      licenseNumber: "CNH123456",
      status: "APPROVED",
      availability: "ONLINE",
      currentLat: "-23.5616840",
      currentLng: "-46.6559810",
      wallet: {
        create: {
          tenantId: tenant.id,
          balance: "184.50",
        },
      },
    },
  });

  const category = await prisma.vehicleCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "economico" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Economico",
      slug: "economico",
      description: "Categoria de entrada para corridas urbanas.",
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: tenant.id, plate: "ABC1D23" } },
    update: {},
    create: {
      tenantId: tenant.id,
      driverId: driver.id,
      categoryId: category.id,
      brand: "Toyota",
      model: "Etios",
      plate: "ABC1D23",
      color: "Prata",
      year: 2022,
      status: "APPROVED",
    },
  });

  await prisma.fareRule.create({
    data: {
      tenantId: tenant.id,
      vehicleCategoryId: category.id,
      name: "Tarifa urbana padrao",
      baseFare: "5.00",
      pricePerKm: "2.80",
      pricePerMinute: "0.42",
      minimumFare: "14.00",
      cancellationFee: "8.00",
      platformCommissionRate: "0.0800",
      tenantCommissionRate: "0.1200",
    },
  });

  await prisma.ride.create({
    data: {
      tenantId: tenant.id,
      passengerId: passenger.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      vehicleCategoryId: category.id,
      status: "DRIVER_ASSIGNED",
      originAddress: "Av. Paulista, 1000",
      originLat: "-23.5650000",
      originLng: "-46.6510000",
      destinationAddress: "Aeroporto de Congonhas",
      destinationLat: "-23.6261110",
      destinationLng: "-46.6563890",
      estimatedDistanceKm: "8.40",
      estimatedDurationMin: 22,
      estimatedPrice: "37.76",
      paymentMethod: "PIX",
      acceptedAt: new Date(),
      statusHistory: {
        create: [
          { tenantId: tenant.id, to: "REQUESTED", reason: "Seed inicial" },
          {
            tenantId: tenant.id,
            from: "REQUESTED",
            to: "SEARCHING_DRIVER",
            reason: "Matching iniciado",
          },
          {
            tenantId: tenant.id,
            from: "SEARCHING_DRIVER",
            to: "DRIVER_ASSIGNED",
            reason: "Motorista aceitou",
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: "seed.create",
      subject: "Tenant",
      subjectId: tenant.id,
      metadata: { message: "Dados de demonstracao criados" },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
