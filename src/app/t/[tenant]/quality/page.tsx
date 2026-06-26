import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { getTenantQualityReport } from "@/server/quality/tenant-quality";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";

export const dynamic = "force-dynamic";

type TenantQualityPageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

function dateTime(value: Date | string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function rating(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default async function TenantQualityPage({
  params,
  searchParams,
}: TenantQualityPageProps) {
  const { tenant } = await params;
  const filters = await searchParams;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const report = await getTenantQualityReport(tenantContext.slug, filters);
  const query = new URLSearchParams();

  if (filters.from) {
    query.set("from", filters.from);
  }

  if (filters.to) {
    query.set("to", filters.to);
  }

  const csvHref = `/api/tenant/${tenantContext.slug}/quality/csv${
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
            Qualidade e avaliacoes
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
            href={`/t/${tenantContext.slug}/drivers`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Motoristas
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
        <StatCard
          label="Media geral"
          value={rating(report.totals.average)}
          detail={`${report.totals.ratings} avaliacoes no periodo.`}
        />
        <StatCard
          label="Motoristas"
          value={`${report.totals.driverRatings}`}
          detail="Avaliacoes recebidas por motoristas."
        />
        <StatCard
          label="Passageiros"
          value={`${report.totals.passengerRatings}`}
          detail="Avaliacoes recebidas por passageiros."
        />
        <StatCard
          label="Comentarios"
          value={`${report.recentComments.length}`}
          detail="Comentarios recentes para revisao."
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Distribuicao de notas
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {report.byScore.map((item) => (
              <div
                key={item.score}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-semibold text-slate-950">
                  {item.score} estrelas
                </span>
                <span className="text-slate-600">
                  {item._count._all} avaliacoes
                </span>
              </div>
            ))}
            {report.byScore.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">
                Nenhuma avaliacao no periodo.
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Ranking de motoristas
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {report.drivers.map((driver) => (
              <div
                key={driver.driverId}
                className="grid gap-4 px-5 py-4 text-sm lg:grid-cols-[1fr_120px_120px]"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {driver.driverName}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {driver.latestComment ?? "Sem comentario recente."}
                  </p>
                  <Link
                    href={`/t/${tenantContext.slug}/rides/${driver.latestRideId}`}
                    className="mt-2 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Ver corrida
                  </Link>
                </div>
                <span className="font-semibold text-slate-950">
                  {rating(driver.average)}
                </span>
                <span className="text-slate-600">
                  {driver.count} avaliacoes
                </span>
              </div>
            ))}
            {report.drivers.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-600">
                Nenhum motorista avaliado no periodo.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Comentarios recentes
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {report.recentComments.map((comment) => (
            <div
              key={comment.id}
              className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[1fr_120px_160px]"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {comment.target}
                </p>
                <p className="mt-1 text-slate-600">{comment.comment}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Autor: {comment.author}
                </p>
              </div>
              <span className="font-semibold text-slate-950">
                {comment.score} estrelas
              </span>
              <div>
                <p className="text-slate-500">{dateTime(comment.createdAt)}</p>
                <Link
                  href={`/t/${tenantContext.slug}/rides/${comment.rideId}`}
                  className="mt-2 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  Ver corrida
                </Link>
              </div>
            </div>
          ))}
          {report.recentComments.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhum comentario no periodo.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
