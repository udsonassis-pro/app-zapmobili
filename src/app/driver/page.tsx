import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NotificationLink } from "@/components/notification-link";
import { StatCard } from "@/components/stat-card";
import { requireAnyRole } from "@/server/auth/session";
import { getDriverWorkboard } from "@/server/drivers/calls";
import { countUnreadInAppNotifications } from "@/server/notifications/in-app";
import { calculateAvailableBalance } from "@/server/payments/wallet-calculations";
import { ActiveRidePanel } from "./active-ride-panel";
import { AvailabilityToggle } from "./availability-toggle";
import { DocumentsPanel } from "./documents-panel";
import { DriverCallsPanel } from "./driver-calls-panel";
import { PayoutPanel } from "./payout-panel";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const session = await requireAnyRole(["DRIVER", "SUPER_ADMIN"]);
  const [{ driver, calls, activeRide, payouts, documents }, unreadCount] =
    await Promise.all([
      getDriverWorkboard(session.sub),
      countUnreadInAppNotifications(session.sub),
    ]);
  const walletBalance = Number(driver.wallet?.balance ?? 0);
  const blockedAmount = Number(driver.wallet?.blockedAmount ?? 0);
  const availableBalance = calculateAvailableBalance({
    balance: walletBalance,
    blockedAmount,
  });
  const balance = walletBalance.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Motorista
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Jornada de trabalho
          </h1>
          <p className="mt-2 text-sm text-slate-600">Sessao: {session.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-teal-700">
            Inicio
          </Link>
          <NotificationLink unreadCount={unreadCount} />
          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Status" value={driver.availability} detail={`Cadastro: ${driver.status}.`} />
        <StatCard label="Carteira" value={balance} detail="Saldo atual do motorista." />
        <StatCard label="Avaliacao" value={Number(driver.rating).toFixed(2).replace(".", ",")} detail="Media registrada no perfil." />
      </section>

      <AvailabilityToggle
        availability={driver.availability}
        disabled={driver.availability === "BUSY" || driver.status !== "APPROVED"}
      />

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <ActiveRidePanel
          ride={
            activeRide
              ? {
                  id: activeRide.id,
                  passenger: activeRide.passenger.user.name,
                  originAddress: activeRide.originAddress,
                  destinationAddress: activeRide.destinationAddress,
                  status: activeRide.status,
                  estimatedPrice: Number(activeRide.estimatedPrice),
                  vehicle: activeRide.vehicle
                    ? `${activeRide.vehicle.brand} ${activeRide.vehicle.model} - ${activeRide.vehicle.plate}`
                    : null,
                }
              : null
          }
        />

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Execucao preparada
          </h2>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            {[
              "Ficar online/offline",
              "Receber chamada",
              "Aceitar ou recusar",
              "Informar chegada",
              "Iniciar corrida",
              "Finalizar corrida",
              "Consultar carteira",
              "Solicitar repasse",
            ].map((step) => (
              <div
                key={step}
                className="border-l-4 border-amber-500 bg-slate-50 px-4 py-3 font-medium text-slate-700"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DriverCallsPanel
        calls={calls.map((ride) => ({
          id: ride.id,
          passenger: ride.passenger.user.name,
          originAddress: ride.originAddress,
          destinationAddress: ride.destinationAddress,
          category: ride.vehicleCategory.name,
          estimatedPrice: Number(ride.estimatedPrice),
          estimatedDistanceKm: Number(ride.estimatedDistanceKm),
          estimatedDurationMin: ride.estimatedDurationMin,
        }))}
      />

      <DocumentsPanel
        documents={documents.map((document) => ({
          id: document.id,
          type: document.type,
          fileUrl: document.fileUrl,
          status: document.status,
          reviewNote: document.reviewNote,
        }))}
      />

      <PayoutPanel
        balance={walletBalance}
        blockedAmount={blockedAmount}
        availableBalance={availableBalance}
        payouts={payouts.map((payout) => ({
          id: payout.id,
          amount: Number(payout.amount),
          status: payout.status,
          requestedAt: payout.requestedAt.toISOString(),
        }))}
      />
    </main>
  );
}
