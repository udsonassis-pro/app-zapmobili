import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { getTenantRideDetails } from "@/server/rides/details";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";

export const dynamic = "force-dynamic";

type TenantRideDetailsPageProps = {
  params: Promise<{ tenant: string; rideId: string }>;
};

function money(value: { toString(): string } | null) {
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

export default async function TenantRideDetailsPage({
  params,
}: TenantRideDetailsPageProps) {
  const { tenant, rideId } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "FINANCE",
    "SUPPORT",
  ]);

  let details: Awaited<ReturnType<typeof getTenantRideDetails>>;

  try {
    details = await getTenantRideDetails(tenantContext.slug, rideId);
  } catch {
    notFound();
  }

  const { ride, walletTransactions, displayPrice, canCancel } = details;
  const lastPayment = ride.payments[0];
  const driverEarning = walletTransactions
    .filter((transaction) => transaction.type === "RIDE_EARNING")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Detalhes da corrida
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name} | Corrida: {ride.id}
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
        <StatCard label="Status" value={ride.status} detail={canCancel ? "Ainda permite cancelamento." : "Acao operacional encerrada."} />
        <StatCard label="Valor" value={money(displayPrice)} detail={`Estimado: ${money(ride.estimatedPrice)}`} />
        <StatCard label="Pagamento" value={lastPayment?.status ?? "Sem pagamento"} detail={lastPayment ? lastPayment.provider : ride.paymentMethod} />
        <StatCard label="Ganho motorista" value={money(driverEarning)} detail={`${walletTransactions.length} lancamentos vinculados.`} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Trajeto</h2>
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Origem
                </p>
                <p className="mt-1 font-medium text-slate-950">
                  {ride.originAddress}
                </p>
                <p className="mt-1 text-slate-500">
                  {Number(ride.originLat).toFixed(7)},{" "}
                  {Number(ride.originLng).toFixed(7)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destino
                </p>
                <p className="mt-1 font-medium text-slate-950">
                  {ride.destinationAddress}
                </p>
                <p className="mt-1 text-slate-500">
                  {Number(ride.destinationLat).toFixed(7)},{" "}
                  {Number(ride.destinationLng).toFixed(7)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                Distancia:{" "}
                <span className="font-semibold text-slate-950">
                  {Number(ride.finalDistanceKm ?? ride.estimatedDistanceKm)} km
                </span>
              </p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                Duracao:{" "}
                <span className="font-semibold text-slate-950">
                  {ride.finalDurationMin ?? ride.estimatedDurationMin} min
                </span>
              </p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                Categoria:{" "}
                <span className="font-semibold text-slate-950">
                  {ride.vehicleCategory.name}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Linha do tempo
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {ride.statusHistory.map((event) => (
                <div
                  key={event.id}
                  className="grid gap-2 py-4 text-sm md:grid-cols-[170px_1fr]"
                >
                  <span className="text-slate-500">
                    {dateTime(event.createdAt)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {event.from ?? "INICIO"} para {event.to}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {event.reason ?? "Sem observacao."}
                    </p>
                    {event.createdBy ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Usuario: {event.createdBy}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Pessoas</h2>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Passageiro
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {ride.passenger.user.name}
                </p>
                <p className="text-slate-500">{ride.passenger.user.email}</p>
                <p className="text-slate-500">
                  {ride.passenger.user.phone ?? "Telefone nao informado"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Motorista
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {ride.driver?.user.name ?? "Sem motorista"}
                </p>
                <p className="text-slate-500">
                  {ride.driver?.user.email ?? "E-mail nao informado"}
                </p>
                <p className="text-slate-500">
                  {ride.driver?.user.phone ?? "Telefone nao informado"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Veiculo</h2>
            {ride.vehicle ? (
              <div className="mt-4 text-sm">
                <p className="font-semibold text-slate-950">
                  {ride.vehicle.brand} {ride.vehicle.model}
                </p>
                <p className="mt-1 text-slate-500">
                  {ride.vehicle.plate} | {ride.vehicle.color} |{" "}
                  {ride.vehicle.year}
                </p>
                <p className="mt-1 text-slate-500">
                  Categoria: {ride.vehicle.category.name}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum veiculo atribuido.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Financeiro</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <p className="flex justify-between">
                <span className="text-slate-500">Metodo</span>
                <span className="font-semibold text-slate-950">
                  {ride.paymentMethod}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Comissao plataforma</span>
                <span className="font-semibold text-slate-950">
                  {money(ride.platformCommission)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Comissao tenant</span>
                <span className="font-semibold text-slate-950">
                  {money(ride.tenantCommission)}
                </span>
              </p>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {ride.payments.map((payment) => (
                <div key={payment.id} className="py-3 text-sm">
                  <p className="font-semibold text-slate-950">
                    {payment.status} | {money(payment.amount)}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {payment.provider} | {dateTime(payment.paidAt)}
                  </p>
                </div>
              ))}
              {ride.payments.length === 0 ? (
                <p className="py-3 text-sm text-slate-600">
                  Nenhum pagamento criado ainda.
                </p>
              ) : null}
            </div>
          </div>

          {ride.cancelReason ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              <h2 className="font-semibold">Motivo do cancelamento</h2>
              <p className="mt-2">{ride.cancelReason}</p>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
