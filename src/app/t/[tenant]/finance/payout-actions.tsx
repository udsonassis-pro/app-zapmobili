"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PayoutActionsProps = {
  tenant: string;
  payoutId: string;
  disabled: boolean;
};

export function PayoutActions({ tenant, payoutId, disabled }: PayoutActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "REJECT") {
    setLoading(decision);
    setMessage(null);

    const response = await fetch(
      `/api/tenant/${tenant}/payouts/${payoutId}/decision`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    const payload = await response.json();
    setLoading(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel atualizar o repasse.");
      return;
    }

    setMessage(`Repasse ${payload.payout.status}.`);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <button
          disabled={disabled || loading !== null}
          onClick={() => decide("APPROVE")}
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "APPROVE" ? "Aprovando..." : "Aprovar"}
        </button>
        <button
          disabled={disabled || loading !== null}
          onClick={() => decide("REJECT")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "REJECT" ? "Rejeitando..." : "Rejeitar"}
        </button>
      </div>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
