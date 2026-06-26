import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { getTenantFinanceReport } from "@/server/payments/tenant-reports";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";

export const dynamic = "force-dynamic";

type TenantFinanceReportsPageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

function money(value: number | { toString(): string } | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(value: Date | string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function TenantFinanceReportsPage({
  params,
  searchParams,
}: TenantFinanceReportsPageProps) {
  const { tenant } = await params;
  const filters = await searchParams;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "FINANCE",
  ]);
  const report = await getTenantFinanceReport(tenantContext.slug, filters);
  const query = new URLSearchParams();

  if (filters.from) {
    query.set("from", filters.from);
  }

  if (filters.to) {
    query.set("to", filters.to);
  }

  const csvHref = `/api/tenant/${tenantContext.slug}/finance/reports/csv${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Relatorios financeiros
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={csvHref}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Exportar CSV
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/finance`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Repasses
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/dashboard`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[180px_180px_120px]">
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
        <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          Filtrar
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Receita paga" value={money(report.totals.revenue)} detail={`${report.totals.paidRides} corridas pagas.`} />
        <StatCard label="Ticket medio" value={money(report.totals.averageTicket)} detail="Receita dividida por corridas pagas." />
        <StatCard label="Comissao tenant" value={money(report.totals.tenantCommission)} detail={`Plataforma: ${money(report.totals.platformCommission)}`} />
        <StatCard label="Repasses pagos" value={money(report.totals.paidPayoutAmount)} detail={`${report.totals.paidPayouts} repasses baixados.`} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Por metodo de pagamento
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {report.byMethod.map((item) => (
              <div
                key={item.method}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-950">{item.method}</p>
                  <p className="text-slate-500">{item._count._all} pagamentos</p>
                </div>
                <span className="font-semibold text-slate-950">
                  {money(Number(item._sum.amount ?? 0))}
                </span>
              </div>
            ))}
            {report.byMethod.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">
                Nenhum pagamento pago no periodo.
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Pagamentos recentes
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {report.payments.map((payment) => (
              <div
                key={payment.id}
                className="grid gap-4 px-5 py-4 text-sm lg:grid-cols-[1fr_140px_120px_140px]"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {payment.ride.passenger.user.name}
                  </p>
                  <p className="mt-1 text-slate-500">
                    Motorista:{" "}
                    {payment.ride.driver?.user.name ?? "Sem motorista"}
                  </p>
                  <Link
                    href={`/t/${tenantContext.slug}/rides/${payment.rideId}`}
                    className="mt-2 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Ver corrida
                  </Link>
                </div>
                <span className="font-semibold text-slate-950">
                  {money(payment.amount)}
                </span>
                <span className="font-medium text-slate-700">
                  {payment.method}
                </span>
                <span className="text-slate-600">
                  {dateTime(payment.paidAt)}
                </span>
              </div>
            ))}
            {report.payments.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-600">
                Nenhum pagamento encontrado no periodo.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
