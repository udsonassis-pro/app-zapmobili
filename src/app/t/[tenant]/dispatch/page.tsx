import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantDispatchBoard } from "@/server/dispatch/dispatch";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import {
  DispatchAssignAction,
  DispatchCancelAction,
} from "./dispatch-actions";

export const dynamic = "force-dynamic";

type TenantDispatchPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function TenantDispatchPage({
  params,
}: TenantDispatchPageProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const { rides, drivers } = await listTenantDispatchBoard(tenantContext.slug);
  const searching = rides.filter((ride) => ride.status === "SEARCHING_DRIVER");
  const assigned = rides.filter((ride) => ride.status === "DRIVER_ASSIGNED");
  const inProgress = rides.filter((ride) =>
    ["DRIVER_ARRIVING", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(ride.status),
  );
  const onlineDrivers = drivers.filter(
    (driver) => driver.availability === "ONLINE" && driver.vehicles.length > 0,
  );
  const driverOptions = drivers.map((driver) => ({
    id: driver.id,
    name: driver.user.name,
    availability: driver.availability,
    vehicles: driver.vehicles.map((vehicle) => ({
      id: vehicle.id,
      label: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
      categoryId: vehicle.categoryId,
      category: vehicle.category.name,
    })),
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Mesa de despacho
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
            href={`/t/${tenantContext.slug}/drivers`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Motoristas
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/rides`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Corridas
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Aguardando motorista" value={`${searching.length}`} detail="Corridas prontas para despacho." />
        <StatCard label="Atribuidas" value={`${assigned.length}`} detail="Motorista definido, aguardando inicio." />
        <StatCard label="Em atendimento" value={`${inProgress.length}`} detail="Motorista em deslocamento ou corrida." />
        <StatCard label="Motoristas online" value={`${onlineDrivers.length}`} detail="Com veiculo aprovado disponivel." />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Corridas operacionais
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="grid gap-4 px-5 py-5 text-sm xl:grid-cols-[1fr_120px_130px_220px_220px]"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {ride.passenger.user.name}
                </p>
                <p className="mt-1 text-slate-500">
                  {ride.originAddress} para {ride.destinationAddress}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Categoria: {ride.vehicleCategory.name} | Valor estimado:{" "}
                  {Number(ride.estimatedPrice).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <Link
                  href={`/t/${tenantContext.slug}/rides/${ride.id}`}
                  className="mt-3 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  Ver detalhes
                </Link>
              </div>
              <span className="font-medium text-slate-700">{ride.status}</span>
              <span className="font-medium text-slate-700">
                {ride.driver?.user.name ?? "Sem motorista"}
              </span>
              <DispatchAssignAction
                tenant={tenantContext.slug}
                rideId={ride.id}
                rideCategoryId={ride.vehicleCategoryId}
                disabled={ride.status !== "SEARCHING_DRIVER"}
                drivers={driverOptions}
              />
              <DispatchCancelAction
                tenant={tenantContext.slug}
                rideId={ride.id}
                disabled={false}
              />
            </div>
          ))}
          {rides.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhuma corrida ativa para despacho.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
