"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type DispatchDriver = {
  id: string;
  name: string;
  availability: string;
  vehicles: {
    id: string;
    label: string;
    categoryId: string;
    category: string;
  }[];
};

type DispatchAssignActionProps = {
  tenant: string;
  rideId: string;
  rideCategoryId: string;
  disabled: boolean;
  drivers: DispatchDriver[];
};

type DispatchCancelActionProps = {
  tenant: string;
  rideId: string;
  disabled: boolean;
};

export function DispatchAssignAction({
  tenant,
  rideId,
  rideCategoryId,
  disabled,
  drivers,
}: DispatchAssignActionProps) {
  const router = useRouter();
  const eligibleOptions = useMemo(
    () =>
      drivers.flatMap((driver) =>
        driver.vehicles
          .filter(
            (vehicle) =>
              vehicle.categoryId === rideCategoryId &&
              driver.availability === "ONLINE",
          )
          .map((vehicle) => ({
            value: `${driver.id}:${vehicle.id}`,
            label: `${driver.name} | ${vehicle.label}`,
          })),
      ),
    [drivers, rideCategoryId],
  );
  const [selected, setSelected] = useState(eligibleOptions[0]?.value ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function assignRide() {
    const [driverId, vehicleId] = selected.split(":");

    if (!driverId || !vehicleId) {
      setMessage("Selecione motorista e veiculo.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch(
      `/api/tenant/${tenant}/dispatch/rides/${rideId}/assign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, vehicleId }),
      },
    );
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel despachar corrida.");
      return;
    }

    setMessage(`Despachada para ${payload.ride.driver}.`);
    router.refresh();
  }

  if (eligibleOptions.length === 0) {
    return (
      <p className="text-xs text-amber-700">
        Sem motorista online com veiculo aprovado nesta categoria.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <select
        disabled={disabled || loading}
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {eligibleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        disabled={disabled || loading}
        onClick={assignRide}
        className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Despachando..." : "Despachar"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}

export function DispatchCancelAction({
  tenant,
  rideId,
  disabled,
}: DispatchCancelActionProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function cancelRide() {
    if (reason.trim().length < 5) {
      setMessage("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch(
      `/api/tenant/${tenant}/dispatch/rides/${rideId}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      },
    );
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel cancelar corrida.");
      return;
    }

    setMessage("Corrida cancelada.");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <input
        disabled={disabled || loading}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Motivo do cancelamento"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        disabled={disabled || loading}
        onClick={cancelRide}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Cancelando..." : "Cancelar corrida"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
