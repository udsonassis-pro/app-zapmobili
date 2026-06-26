import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantDriverOperations } from "@/server/drivers/operations";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import {
  DriverOperationalActions,
  VehicleOperationalActions,
} from "./driver-operational-actions";

export const dynamic = "force-dynamic";

type TenantDriversPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function TenantDriversPage({
  params,
}: TenantDriversPageProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const { drivers } = await listTenantDriverOperations(tenantContext.slug);
  const pending = drivers.filter((driver) => driver.status === "PENDING");
  const approved = drivers.filter((driver) => driver.status === "APPROVED");
  const blocked = drivers.filter((driver) =>
    ["REJECTED", "SUSPENDED"].includes(driver.status),
  );
  const vehiclesPending = drivers.flatMap((driver) =>
    driver.vehicles.filter((vehicle) => vehicle.status === "PENDING"),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Motoristas e veiculos
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
            href={`/t/${tenantContext.slug}/drivers/documents`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Documentos
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pendentes" value={`${pending.length}`} detail="Aguardando liberacao operacional." />
        <StatCard label="Aprovados" value={`${approved.length}`} detail="Podem receber corridas." />
        <StatCard label="Bloqueados" value={`${blocked.length}`} detail="Rejeitados ou suspensos." />
        <StatCard label="Veiculos pendentes" value={`${vehiclesPending.length}`} detail="Precisam de revisao." />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Fila operacional
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {drivers.map((driver) => {
            const approvedDocuments = driver.documents.filter(
              (document) => document.status === "APPROVED",
            ).length;
            const pendingDocuments = driver.documents.filter(
              (document) => document.status === "PENDING",
            ).length;
            const approvedVehicles = driver.vehicles.filter(
              (vehicle) => vehicle.status === "APPROVED",
            ).length;
            const canApprove = approvedDocuments > 0 && approvedVehicles > 0;

            return (
              <div key={driver.id} className="grid gap-5 px-5 py-5 text-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_120px_120px_180px]">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {driver.user.name}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {driver.user.email}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Docs aprovados: {approvedDocuments} | pendentes:{" "}
                      {pendingDocuments} | veiculos aprovados:{" "}
                      {approvedVehicles}
                    </p>
                  </div>
                  <span className="font-medium text-slate-700">
                    {driver.status}
                  </span>
                  <span className="font-medium text-slate-700">
                    {driver.availability}
                  </span>
                  <DriverOperationalActions
                    tenant={tenantContext.slug}
                    driverId={driver.id}
                    currentStatus={driver.status}
                    canApprove={canApprove}
                  />
                </div>

                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Veiculos cadastrados
                  </h3>
                  <div className="grid gap-3">
                    {driver.vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_110px_180px]"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {vehicle.plate} | {vehicle.category.name} |{" "}
                            {vehicle.year}
                          </p>
                        </div>
                        <span className="font-medium text-slate-700">
                          {vehicle.status}
                        </span>
                        <VehicleOperationalActions
                          tenant={tenantContext.slug}
                          vehicleId={vehicle.id}
                          currentStatus={vehicle.status}
                        />
                      </div>
                    ))}
                    {driver.vehicles.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        Nenhum veiculo cadastrado para este motorista.
                      </p>
                    ) : null}
                  </div>
                </div>

                {!canApprove && driver.status !== "APPROVED" ? (
                  <p className="text-xs text-amber-700">
                    Para aprovar, o motorista precisa ter ao menos um documento
                    aprovado e um veiculo aprovado.
                  </p>
                ) : null}
              </div>
            );
          })}
          {drivers.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhum motorista cadastrado ainda.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
