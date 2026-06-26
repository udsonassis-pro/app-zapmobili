import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NotificationLink } from "@/components/notification-link";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/prisma";
import { requireTenantRole } from "@/server/auth/session";
import { countUnreadInAppNotifications } from "@/server/notifications/in-app";
import { getTenantSupportSummary } from "@/server/support/ride-support";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";

export const dynamic = "force-dynamic";

type TenantDashboardProps = {
  params: Promise<{ tenant: string }>;
};

export default async function TenantDashboard({ params }: TenantDashboardProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
    "SUPPORT",
  ]);
  const tenantRecord = await prisma.tenant.findUnique({
    where: { slug: tenantContext.slug },
    select: { id: true },
  });

  if (!tenantRecord) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-950">
          Tenant nao encontrado
        </h1>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeRides,
    onlineDrivers,
    pendingDocuments,
    paidToday,
    paidPayments,
    liveRides,
    unreadCount,
    supportSummary,
  ] = await Promise.all([
    prisma.ride.count({
      where: {
        tenantId: tenantRecord.id,
        status: {
          in: [
            "REQUESTED",
            "SEARCHING_DRIVER",
            "DRIVER_ASSIGNED",
            "DRIVER_ARRIVING",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
          ],
        },
      },
    }),
    prisma.driverProfile.count({
      where: {
        tenantId: tenantRecord.id,
        availability: "ONLINE",
        status: "APPROVED",
      },
    }),
    prisma.driverDocument.count({
      where: {
        tenantId: tenantRecord.id,
        status: "PENDING",
      },
    }),
    prisma.payment.aggregate({
      where: {
        tenantId: tenantRecord.id,
        status: "PAID",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: {
        tenantId: tenantRecord.id,
        status: "PAID",
      },
    }),
    prisma.ride.findMany({
      where: { tenantId: tenantRecord.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true } } } },
      },
    }),
    countUnreadInAppNotifications(session.sub),
    getTenantSupportSummary(tenantRecord.id),
  ]);

  const revenue = Number(paidToday._sum.amount ?? 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Painel operacional
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/t/${tenantContext.slug}/dispatch`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Despacho
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/rides`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Corridas
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/drivers`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Motoristas
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/finance`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Financeiro
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/finance/reports`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Relatorios
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/pricing`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Tarifas
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/quality`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Qualidade
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/support`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Suporte
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/drivers/documents`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Documentos
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            SaaS global
          </Link>
          <NotificationLink unreadCount={unreadCount} />
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Corridas ativas" value={`${activeRides}`} detail="Lidas direto do banco de desenvolvimento." />
        <StatCard label="Motoristas online" value={`${onlineDrivers}`} detail="Aprovados e disponiveis para matching." />
        <StatCard label="Receita paga hoje" value={revenue} detail={`${paidPayments} pagamentos aprovados no total.`} />
        <StatCard label="Documentos pendentes" value={`${pendingDocuments}`} detail="Aguardando revisao administrativa." />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Suporte ativo" value={`${supportSummary.active}`} detail={`${supportSummary.open} chamados abertos.`} />
        <StatCard label="SLA vencido" value={`${supportSummary.overdue}`} detail="Chamados ativos fora do prazo." />
        <StatCard label="SLA proximo" value={`${supportSummary.dueSoon}`} detail="Vencem em ate 1 hora." />
        <StatCard label="Criticos" value={`${supportSummary.critical}`} detail="Prioridade critica em suporte." />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Corridas em andamento
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {liveRides.map((ride) => (
              <div
                key={ride.id}
                className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_1fr_180px_100px]"
              >
                <span className="font-medium text-slate-950">
                  {ride.passenger.user.name}
                </span>
                <span className="text-slate-600">
                  {ride.driver?.user.name ?? "Sem motorista"}
                </span>
                <span className="text-slate-600">{ride.status}</span>
                <span className="font-semibold text-slate-950">
                  {Number(ride.estimatedPrice).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <Link
                  href={`/t/${tenantContext.slug}/rides/${ride.id}`}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 md:col-span-4"
                >
                  Ver detalhes
                </Link>
              </div>
            ))}
            {liveRides.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-600">
                Nenhuma corrida criada ainda.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Mapa operacional</h2>
          <div className="mt-4 aspect-square rounded-lg border border-slate-200 bg-[linear-gradient(90deg,#e2e8f0_1px,transparent_1px),linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px]">
            <div className="relative h-full">
              <span className="absolute left-[18%] top-[24%] h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-100" />
              <span className="absolute left-[62%] top-[42%] h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              <span className="absolute left-[45%] top-[70%] h-3 w-3 rounded-full bg-slate-900 ring-4 ring-slate-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
