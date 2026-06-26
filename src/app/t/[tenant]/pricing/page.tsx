import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantPricing } from "@/server/pricing/admin-pricing";
import { commissionRateToPercent } from "@/server/pricing/admin-schemas";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import { CategoryCreateForm, FareRulePublishForm } from "./pricing-actions";

export const dynamic = "force-dynamic";

type TenantPricingPageProps = {
  params: Promise<{ tenant: string }>;
};

function money(value: { toString(): string } | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function TenantPricingPage({
  params,
}: TenantPricingPageProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
  ]);
  const { categories } = await listTenantPricing(tenantContext.slug);
  const activeCategories = categories.filter((category) => category.active);
  const categoriesWithFare = categories.filter((category) =>
    category.fareRules.some((fareRule) => fareRule.active),
  );
  const vehicles = categories.reduce(
    (total, category) => total + category._count.vehicles,
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
            Categorias e tarifas
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/t/${tenantContext.slug}/dashboard`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Dashboard
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/finance/reports`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Relatorios
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Categorias" value={`${categories.length}`} detail={`${activeCategories.length} ativas.`} />
        <StatCard label="Com tarifa ativa" value={`${categoriesWithFare.length}`} detail="Disponiveis para precificacao." />
        <StatCard label="Veiculos vinculados" value={`${vehicles}`} detail="Soma por categoria." />
        <StatCard label="Tarifas historicas" value={`${categories.reduce((total, category) => total + category.fareRules.length, 0)}`} detail="Ultimas 5 por categoria." />
      </div>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Nova categoria
          </h2>
          <div className="mt-4">
            <CategoryCreateForm tenant={tenantContext.slug} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Categorias cadastradas
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {categories.map((category) => {
              const activeFare = category.fareRules.find(
                (fareRule) => fareRule.active,
              );

              return (
                <div key={category.id} className="grid gap-5 px-5 py-5 text-sm">
                  <div className="grid gap-4 lg:grid-cols-[1fr_140px_140px]">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {category.name}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {category.slug} | {category.seats} lugares |{" "}
                        {category.acceptsMoto ? "Aceita moto" : "Carro"}
                      </p>
                    </div>
                    <span className="font-medium text-slate-700">
                      {category.active ? "ATIVA" : "INATIVA"}
                    </span>
                    <span className="font-medium text-slate-700">
                      {category._count.rides} corridas
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Tarifa ativa
                    </h3>
                    {activeFare ? (
                      <div className="mt-3 grid gap-3 text-xs md:grid-cols-4">
                        <p>Base: {money(activeFare.baseFare)}</p>
                        <p>Km: {money(activeFare.pricePerKm)}</p>
                        <p>Min: {money(activeFare.pricePerMinute)}</p>
                        <p>Minima: {money(activeFare.minimumFare)}</p>
                        <p>
                          Plataforma:{" "}
                          {commissionRateToPercent(
                            Number(activeFare.platformCommissionRate),
                          )}
                          %
                        </p>
                        <p>
                          Tenant:{" "}
                          {commissionRateToPercent(
                            Number(activeFare.tenantCommissionRate),
                          )}
                          %
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        Nenhuma tarifa ativa para esta categoria.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Publicar nova tarifa
                    </h3>
                    <div className="mt-3">
                      <FareRulePublishForm
                        tenant={tenantContext.slug}
                        categoryId={category.id}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-600">
                Nenhuma categoria cadastrada ainda.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
