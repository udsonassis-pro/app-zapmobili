import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantPayouts } from "@/server/payments/admin-payouts";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import { PayoutActions } from "./payout-actions";

export const dynamic = "force-dynamic";

type TenantFinancePageProps = {
  params: Promise<{ tenant: string }>;
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function TenantFinancePage({
  params,
}: TenantFinancePageProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "FINANCE",
  ]);
  const { payouts } = await listTenantPayouts(tenantContext.slug);

  const requested = payouts.filter((payout) => payout.status === "REQUESTED");
  const paid = payouts.filter((payout) => payout.status === "PAID");
  const requestedAmount = requested.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0,
  );
  const paidAmount = paid.reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Financeiro
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/t/${tenantContext.slug}/finance/reports`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Relatorios
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
        <StatCard
          label="Solicitados"
          value={`${requested.length}`}
          detail="Repasses aguardando decisao."
        />
        <StatCard
          label="Valor solicitado"
          value={currency(requestedAmount)}
          detail="Total bloqueado em carteira."
        />
        <StatCard
          label="Pagos"
          value={`${paid.length}`}
          detail="Repasses ja aprovados."
        />
        <StatCard
          label="Valor pago"
          value={currency(paidAmount)}
          detail="Baixado da carteira dos motoristas."
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Repasses de motoristas
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="grid gap-4 px-5 py-4 text-sm lg:grid-cols-[1fr_140px_130px_160px_180px]"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {payout.driver.user.name}
                </p>
                <p className="mt-1 text-slate-500">{payout.driver.user.email}</p>
              </div>
              <span className="font-semibold text-slate-950">
                {currency(Number(payout.amount))}
              </span>
              <span className="font-medium text-slate-700">{payout.status}</span>
              <span className="text-slate-600">
                Bloqueado: {currency(Number(payout.driver.wallet?.blockedAmount ?? 0))}
              </span>
              <PayoutActions
                tenant={tenantContext.slug}
                payoutId={payout.id}
                disabled={payout.status !== "REQUESTED"}
              />
            </div>
          ))}
          {payouts.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhum repasse solicitado ainda.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
