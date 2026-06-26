import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireSession } from "@/server/auth/session";
import { getUserRideDetails } from "@/server/rides/details";
import { CancelRidePanel } from "./cancel-ride-panel";
import { RatingPanel } from "./rating-panel";
import { SupportTicketPanel } from "./support-ticket-panel";

export const dynamic = "force-dynamic";

type UserRideDetailsPageProps = {
  params: Promise<{ rideId: string }>;
};

function money(value: { toString(): string } | number | null) {
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

export default async function UserRideDetailsPage({
  params,
}: UserRideDetailsPageProps) {
  const { rideId } = await params;
  const session = await requireSession();

  let details: Awaited<ReturnType<typeof getUserRideDetails>>;

  try {
    details = await getUserRideDetails(session.sub, rideId);
  } catch {
    notFound();
  }

  const {
    ride,
    viewerRole,
    currentUserRating,
    displayPrice,
    canCancel,
    canRate,
  } = details;
  const lastPayment = ride.payments[0];
  const homeHref = viewerRole === "DRIVER" ? "/driver" : "/app/request";
  const homeLabel =
    viewerRole === "DRIVER" ? "Painel do motorista" : "Area do passageiro";
  const counterpart =
    viewerRole === "DRIVER"
      ? {
          label: "Passageiro",
          name: ride.passenger.user.name,
          email: ride.passenger.user.email,
          phone: ride.passenger.user.phone,
        }
      : {
          label: "Motorista",
          name: ride.driver?.user.name ?? "Sem motorista",
          email: ride.driver?.user.email ?? "E-mail nao informado",
          phone: ride.driver?.user.phone,
        };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            {viewerRole === "DRIVER" ? "Motorista" : "Passageiro"}
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
            href={homeHref}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            {homeLabel}
          </Link>
          <Link
            href="/notifications"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Notificacoes
          </Link>
          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Status"
          value={ride.status}
          detail={canCancel ? "Corrida ainda ativa." : "Fluxo encerrado."}
        />
        <StatCard
          label="Valor"
          value={money(displayPrice)}
          detail={`Estimado: ${money(ride.estimatedPrice)}`}
        />
        <StatCard
          label="Pagamento"
          value={lastPayment?.status ?? "Sem pagamento"}
          detail={lastPayment ? lastPayment.provider : ride.paymentMethod}
        />
        <StatCard
          label="Categoria"
          value={ride.vehicleCategory.name}
          detail={`${ride.estimatedDurationMin} min estimados.`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Trajeto</h2>
            <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Origem
                </p>
                <p className="mt-2 font-medium text-slate-950">
                  {ride.originAddress}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destino
                </p>
                <p className="mt-2 font-medium text-slate-950">
                  {ride.destinationAddress}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p className="rounded-lg border border-slate-200 px-4 py-3 text-slate-700">
                Distancia:{" "}
                <span className="font-semibold text-slate-950">
                  {Number(ride.finalDistanceKm ?? ride.estimatedDistanceKm)} km
                </span>
              </p>
              <p className="rounded-lg border border-slate-200 px-4 py-3 text-slate-700">
                Duracao:{" "}
                <span className="font-semibold text-slate-950">
                  {ride.finalDurationMin ?? ride.estimatedDurationMin} min
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
                  className="grid gap-2 py-4 text-sm md:grid-cols-[160px_1fr]"
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              {counterpart.label}
            </h2>
            <div className="mt-4 text-sm">
              <p className="font-semibold text-slate-950">
                {counterpart.name}
              </p>
              <p className="mt-1 text-slate-500">{counterpart.email}</p>
              <p className="mt-1 text-slate-500">
                {counterpart.phone ?? "Telefone nao informado"}
              </p>
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
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum veiculo atribuido.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Pagamento</h2>
            <div className="mt-4 divide-y divide-slate-100">
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

          <SupportTicketPanel rideId={ride.id} />

          {canCancel ? (
            <CancelRidePanel rideId={ride.id} viewerRole={viewerRole} />
          ) : null}

          {canRate ? (
            <RatingPanel
              rideId={ride.id}
              viewerRole={viewerRole}
              targetName={counterpart.name}
            />
          ) : null}

          {currentUserRating ? (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-sm text-teal-950">
              <h2 className="font-semibold">Avaliacao enviada</h2>
              <p className="mt-2">
                Nota {currentUserRating.score} de 5
                {currentUserRating.comment
                  ? ` | ${currentUserRating.comment}`
                  : ""}
              </p>
            </div>
          ) : null}

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
