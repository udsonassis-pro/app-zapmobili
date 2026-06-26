"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AvailabilityToggleProps = {
  availability: string;
  disabled: boolean;
};

export function AvailabilityToggle({
  availability,
  disabled,
}: AvailabilityToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const target = availability === "ONLINE" ? "OFFLINE" : "ONLINE";

  async function updateAvailability() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/driver/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: target }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel atualizar status.");
      return;
    }

    setMessage(`Status atualizado para ${payload.driver.availability}.`);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Disponibilidade
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Status atual: <span className="font-semibold">{availability}</span>
          </p>
        </div>
        <button
          disabled={disabled || loading}
          onClick={updateAvailability}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Atualizando..."
            : availability === "ONLINE"
              ? "Ficar offline"
              : "Ficar online"}
        </button>
      </div>
      {availability === "BUSY" ? (
        <p className="mt-3 text-xs text-amber-700">
          Voce esta em corrida. A disponibilidade sera liberada ao finalizar.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
