import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantRideHistory } from "@/server/rides/history";
import { rideStatuses, type RideStatus } from "@/server/rides/status";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";

export const dynamic = "force-dynamic";

type TenantRidesPageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{
    status?: string;
    query?: string;
    from?: string;
    to?: string;
  }>;
};

function money(value: { toString(): string } | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(value: Date | string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function TenantRidesPage({
  params,
  searchParams,
}: TenantRidesPageProps) {
  const { tenant } = await params;
  const filters = await searchParams;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
    "SUPPORT",
  ]);
  const result = await listTenantRideHistory(tenantContext.slug, filters);
  const statusCounts = new Map(
    result.byStatus.map((item) => [item.status, item._count._all]),
  );
  const paidCount = statusCounts.get("PAID") ?? 0;
  const canceledCount =
    (statusCounts.get("CANCELED_BY_PASSENGER") ?? 0) +
    (statusCounts.get("CANCELED_BY_DRIVER") ?? 0) +
    (statusCounts.get("CANCELED_BY_SYSTEM") ?? 0);
  const activeStatuses: RideStatus[] = [
    "SEARCHING_DRIVER",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
  ];
  const activeCount = activeStatuses.reduce(
    (total, status) => total + (statusCounts.get(status) ?? 0),
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Historico de corridas
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
            href={`/t/${tenantContext.slug}/dashboard`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Resultado filtrado" value={`${result.total}`} detail="Limitado a 50 registros na tela." />
        <StatCard label="Ativas" value={`${activeCount}`} detail="Busca, atribuidas ou em atendimento." />
        <StatCard label="Pagas" value={`${paidCount}`} detail="Historico financeiro concluido." />
        <StatCard label="Canceladas" value={`${canceledCount}`} detail="Canceladas por passageiro, motorista ou sistema." />
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_160px_160px_120px]">
        <input
          name="query"
          defaultValue={filters.query ?? ""}
          placeholder="Buscar por passageiro, motorista ou endereco"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todos os status</option>
          {rideStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Corridas encontradas
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {result.rides.map((ride) => (
            <div
              key={ride.id}
              className="grid gap-4 px-5 py-5 text-sm xl:grid-cols-[1fr_140px_140px_130px_120px]"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {ride.passenger.user.name}
                </p>
                <p className="mt-1 text-slate-500">
                  {ride.originAddress} para {ride.destinationAddress}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {dateTime(ride.requestedAt)} | {ride.vehicleCategory.name}
                </p>
              </div>
              <span className="font-medium text-slate-700">{ride.status}</span>
              <span className="font-medium text-slate-700">
                {ride.driver?.user.name ?? "Sem motorista"}
              </span>
              <span className="font-semibold text-slate-950">
                {money(ride.finalPrice ?? ride.estimatedPrice)}
              </span>
              <Link
                href={`/t/${tenantContext.slug}/rides/${ride.id}`}
                className="text-sm font-semibold text-teal-700 hover:text-teal-900"
              >
                Ver detalhes
              </Link>
            </div>
          ))}
          {result.rides.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhuma corrida encontrada com os filtros atuais.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
