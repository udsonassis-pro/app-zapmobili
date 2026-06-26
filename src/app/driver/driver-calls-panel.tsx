"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DriverCall = {
  id: string;
  passenger: string;
  originAddress: string;
  destinationAddress: string;
  category: string;
  estimatedPrice: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
};

type DriverCallsPanelProps = {
  calls: DriverCall[];
};

export function DriverCallsPanel({ calls }: DriverCallsPanelProps) {
  const router = useRouter();
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [decliningRideId, setDecliningRideId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function acceptRide(rideId: string) {
    setAcceptingRideId(rideId);
    setMessage(null);

    const response = await fetch(`/api/driver/calls/${rideId}/accept`, {
      method: "POST",
    });
    const payload = await response.json();
    setAcceptingRideId(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel aceitar a corrida.");
      return;
    }

    setMessage(`Corrida aceita. Status: ${payload.ride.status}.`);
    router.refresh();
  }

  async function declineRide(rideId: string) {
    setDecliningRideId(rideId);
    setMessage(null);

    const response = await fetch(`/api/driver/calls/${rideId}/decline`, {
      method: "POST",
    });
    const payload = await response.json();
    setDecliningRideId(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel recusar a corrida.");
      return;
    }

    setMessage(`Corrida recusada: ${payload.ride.passenger}.`);
    router.refresh();
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Chamadas</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Nenhuma corrida aguardando aceite para este motorista.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Chamadas</h2>
      {message ? (
        <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4">
        {calls.map((call) => (
          <article
            key={call.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Passageiro</p>
                <h3 className="mt-1 font-semibold text-slate-950">
                  {call.passenger}
                </h3>
              </div>
              <strong className="text-lg text-slate-950">
                {call.estimatedPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-slate-500">Origem</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {call.originAddress}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Destino</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {call.destinationAddress}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Categoria</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {call.category}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Estimativa</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {call.estimatedDistanceKm.toFixed(1).replace(".", ",")} km /{" "}
                  {call.estimatedDurationMin} min
                </dd>
              </div>
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => acceptRide(call.id)}
                disabled={acceptingRideId === call.id || decliningRideId === call.id}
                className="rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptingRideId === call.id ? "Aceitando..." : "Aceitar"}
              </button>
              <button
                onClick={() => declineRide(call.id)}
                disabled={acceptingRideId === call.id || decliningRideId === call.id}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {decliningRideId === call.id ? "Recusando..." : "Recusar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
