"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveRide = {
  id: string;
  passenger: string;
  originAddress: string;
  destinationAddress: string;
  status: string;
  estimatedPrice: number;
  vehicle: string | null;
};

type ActiveRidePanelProps = {
  ride: ActiveRide | null;
};

const actionByStatus: Record<
  string,
  { action: string; label: string; nextLabel: string }
> = {
  DRIVER_ASSIGNED: {
    action: "START_TO_PICKUP",
    label: "Iniciar deslocamento",
    nextLabel: "Vai para DRIVER_ARRIVING",
  },
  DRIVER_ARRIVING: {
    action: "MARK_ARRIVED",
    label: "Informar chegada",
    nextLabel: "Vai para DRIVER_ARRIVED",
  },
  DRIVER_ARRIVED: {
    action: "START_RIDE",
    label: "Iniciar corrida",
    nextLabel: "Vai para IN_PROGRESS",
  },
  IN_PROGRESS: {
    action: "COMPLETE_RIDE",
    label: "Finalizar corrida",
    nextLabel: "Vai para COMPLETED",
  },
};

export function ActiveRidePanel({ ride }: ActiveRidePanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!ride) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Corrida ativa</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Nenhuma corrida em execucao para este motorista.
        </p>
      </div>
    );
  }

  const nextAction = actionByStatus[ride.status];

  async function advanceRide() {
    if (!ride || !nextAction) return;

    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/driver/rides/${ride.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: nextAction.action }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel atualizar a corrida.");
      return;
    }

    setMessage(`Status atualizado para ${payload.ride.status}.`);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Corrida ativa
          </h2>
          <p className="mt-1 text-sm font-medium text-teal-700">
            {ride.status}
          </p>
        </div>
        <strong className="text-lg text-slate-950">
          {ride.estimatedPrice.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </strong>
      </div>

      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Passageiro</dt>
          <dd className="mt-1 font-semibold text-slate-950">{ride.passenger}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Origem</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {ride.originAddress}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Destino</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {ride.destinationAddress}
          </dd>
        </div>
        {ride.vehicle ? (
          <div>
            <dt className="text-slate-500">Veiculo</dt>
            <dd className="mt-1 font-medium text-slate-800">{ride.vehicle}</dd>
          </div>
        ) : null}
      </dl>

      {message ? (
        <p className="mt-5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      ) : null}

      {nextAction ? (
        <button
          onClick={advanceRide}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Atualizando..." : nextAction.label}
        </button>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Fluxo operacional encerrado nesta etapa.
        </p>
      )}

      {nextAction ? (
        <p className="mt-2 text-xs text-slate-500">{nextAction.nextLabel}</p>
      ) : null}
    </div>
  );
}
