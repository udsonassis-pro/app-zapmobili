"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CancelRidePanelProps = {
  rideId: string;
  viewerRole: "PASSENGER" | "DRIVER";
};

export function CancelRidePanel({ rideId, viewerRole }: CancelRidePanelProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cancelRide() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/rides/${rideId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error ?? "Nao foi possivel cancelar a corrida.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-red-950">Cancelar corrida</h2>
      <p className="mt-2 text-sm leading-6 text-red-900">
        {viewerRole === "DRIVER"
          ? "Use esta acao se nao puder seguir com a chamada."
          : "Use esta acao se nao quiser mais seguir com a corrida."}
      </p>
      <label className="mt-4 block text-sm font-medium text-red-950">
        Motivo
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-red-500"
          placeholder="Informe o motivo do cancelamento"
        />
      </label>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={cancelRide}
        disabled={loading || reason.trim().length < 5}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Cancelando..." : "Confirmar cancelamento"}
      </button>
    </div>
  );
}
