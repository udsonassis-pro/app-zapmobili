import { prisma } from "@/lib/prisma";
import {
  calculateTicketAverage,
  normalizeFinanceReportFilters,
  paymentDateRangeFromFilters,
} from "@/server/payments/report-filters";

export async function getTenantFinanceReport(
  tenantSlug: string,
  rawFilters: unknown,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const filters = normalizeFinanceReportFilters(rawFilters);
  const paidAt = paymentDateRangeFromFilters(filters);
  const paymentWhere = {
    tenantId: tenant.id,
    status: "PAID" as const,
    ...(paidAt ? { paidAt } : {}),
  };

  const [payments, paidPayments, byMethod, payoutsPaid] = await Promise.all([
    prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { paidAt: "desc" },
      take: 100,
      include: {
        ride: {
          include: {
            passenger: { include: { user: { select: { name: true } } } },
            driver: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.payment.aggregate({
      where: paymentWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: paymentWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.driverPayout.aggregate({
      where: {
        tenantId: tenant.id,
        status: "PAID",
        ...(paidAt ? { paidAt } : {}),
      },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const revenue = Number(paidPayments._sum.amount ?? 0);
  const platformCommission = payments.reduce(
    (total, payment) => total + Number(payment.ride.platformCommission ?? 0),
    0,
  );
  const tenantCommission = payments.reduce(
    (total, payment) => total + Number(payment.ride.tenantCommission ?? 0),
    0,
  );
  const driverEarnings = Math.max(
    revenue - platformCommission - tenantCommission,
    0,
  );

  return {
    tenant,
    filters,
    payments,
    totals: {
      paidRides: paidPayments._count._all,
      revenue,
      platformCommission,
      tenantCommission,
      driverEarnings,
      averageTicket: calculateTicketAverage({
        revenue,
        paidRides: paidPayments._count._all,
      }),
      paidPayouts: payoutsPaid._count._all,
      paidPayoutAmount: Number(payoutsPaid._sum.amount ?? 0),
    },
    byMethod,
  };
}

export function buildTenantFinanceCsv(
  report: Awaited<ReturnType<typeof getTenantFinanceReport>>,
) {
  const rows = [
    [
      "payment_id",
      "ride_id",
      "paid_at",
      "method",
      "status",
      "amount",
      "passenger",
      "driver",
    ],
    ...report.payments.map((payment) => [
      payment.id,
      payment.rideId,
      payment.paidAt?.toISOString() ?? "",
      payment.method,
      payment.status,
      Number(payment.amount).toFixed(2),
      payment.ride.passenger.user.name,
      payment.ride.driver?.user.name ?? "",
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
