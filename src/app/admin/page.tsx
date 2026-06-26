import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireAnyRole } from "@/server/auth/session";

export const dynamic = "force-dynamic";

const tenants = [
  { name: "Zap Demo", slug: "demo", status: "TRIAL", drivers: 18, rides: 124 },
  { name: "Coop Norte", slug: "coop-norte", status: "ACTIVE", drivers: 42, rides: 891 },
  { name: "Executivo Prime", slug: "prime", status: "ACTIVE", drivers: 12, rides: 76 },
];

export default async function AdminPage() {
  const session = await requireAnyRole(["SUPER_ADMIN"]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            SaaS global
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Operacao da plataforma
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Voltar
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tenants ativos" value="2" detail="Clientes com operacao liberada." />
        <StatCard label="Em trial" value="1" detail="Ambiente de avaliacao comercial." />
        <StatCard label="Corridas no mes" value="1.091" detail="Volume agregado de demonstracao." />
        <StatCard label="Alertas" value="0" detail="Sem bloqueios criticos na base inicial." />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Tenants</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {tenants.map((tenant) => (
            <div
              key={tenant.slug}
              className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_120px_120px_120px]"
            >
              <Link
                href={`/t/${tenant.slug}/dashboard`}
                className="font-semibold text-slate-950 hover:text-teal-700"
              >
                {tenant.name}
              </Link>
              <span className="text-slate-600">{tenant.status}</span>
              <span className="text-slate-600">{tenant.drivers} motoristas</span>
              <span className="text-slate-600">{tenant.rides} corridas</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
