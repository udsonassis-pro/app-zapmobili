import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NotificationLink } from "@/components/notification-link";
import { requireAnyRole } from "@/server/auth/session";
import { countUnreadInAppNotifications } from "@/server/notifications/in-app";
import { listAvailableRideCategoriesForUser } from "@/server/rides/available-categories";
import { RequestRideForm } from "./request-ride-form";

export const dynamic = "force-dynamic";

const defaultRideInput = {
  distanceKm: 8.4,
  durationMinutes: 22,
};

export default async function PassengerRequestPage() {
  const session = await requireAnyRole(["PASSENGER"]);
  const [categories, unreadCount] = await Promise.all([
    listAvailableRideCategoriesForUser(session.sub, defaultRideInput),
    countUnreadInAppNotifications(session.sub),
  ]);
  const firstEstimate = categories[0]?.estimate;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Passageiro
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Solicitar corrida
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

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Estimativa inicial
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Distancia</dt>
              <dd className="mt-1 font-semibold text-slate-950">8,4 km</dd>
            </div>
            <div>
              <dt className="text-slate-500">Duracao</dt>
              <dd className="mt-1 font-semibold text-slate-950">22 min</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {firstEstimate
                  ? firstEstimate.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "Sem tarifa"}
              </dd>
            </div>
          </dl>
        </div>

        <RequestRideForm
          categories={categories.map(({ category, estimate }) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            seats: category.seats,
            acceptsMoto: category.acceptsMoto,
            estimateTotal: estimate.total,
          }))}
        />
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Categorias</h2>
        <div className="mt-4 grid gap-3">
          {categories.map(({ category, estimate }) => (
            <div
              key={category.id}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <p className="font-medium text-slate-950">{category.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {category.seats} lugares |{" "}
                {estimate.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          ))}
          {categories.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nenhuma categoria com tarifa ativa.
            </p>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
