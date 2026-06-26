"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DriverOperationalActionsProps = {
  tenant: string;
  driverId: string;
  currentStatus: string;
  canApprove: boolean;
};

type VehicleOperationalActionsProps = {
  tenant: string;
  vehicleId: string;
  currentStatus: string;
};

export function DriverOperationalActions({
  tenant,
  driverId,
  currentStatus,
  canApprove,
}: DriverOperationalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setLoading(status);
    setMessage(null);

    const response = await fetch(
      `/api/tenant/${tenant}/drivers/${driverId}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const payload = await response.json();
    setLoading(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel atualizar motorista.");
      return;
    }

    setMessage(`Motorista ${payload.driver.status}.`);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={!canApprove || loading !== null || currentStatus === "APPROVED"}
          onClick={() => updateStatus("APPROVED")}
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "APPROVED" ? "Aprovando..." : "Aprovar"}
        </button>
        <button
          disabled={loading !== null || currentStatus === "SUSPENDED"}
          onClick={() => updateStatus("SUSPENDED")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "SUSPENDED" ? "Suspendendo..." : "Suspender"}
        </button>
        <button
          disabled={loading !== null || currentStatus === "REJECTED"}
          onClick={() => updateStatus("REJECTED")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "REJECTED" ? "Rejeitando..." : "Rejeitar"}
        </button>
      </div>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}

export function VehicleOperationalActions({
  tenant,
  vehicleId,
  currentStatus,
}: VehicleOperationalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setLoading(status);
    setMessage(null);

    const response = await fetch(
      `/api/tenant/${tenant}/vehicles/${vehicleId}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const payload = await response.json();
    setLoading(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel atualizar veiculo.");
      return;
    }

    setMessage(`Veiculo ${payload.vehicle.status}.`);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading !== null || currentStatus === "APPROVED"}
          onClick={() => updateStatus("APPROVED")}
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "APPROVED" ? "Aprovando..." : "Aprovar"}
        </button>
        <button
          disabled={loading !== null || currentStatus === "INACTIVE"}
          onClick={() => updateStatus("INACTIVE")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "INACTIVE" ? "Inativando..." : "Inativar"}
        </button>
        <button
          disabled={loading !== null || currentStatus === "REJECTED"}
          onClick={() => updateStatus("REJECTED")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "REJECTED" ? "Rejeitando..." : "Rejeitar"}
        </button>
      </div>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
