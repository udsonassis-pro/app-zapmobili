"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SlaAlertActionProps = {
  tenant: string;
};

type SlaAlertResult = {
  checked: number;
  overdue: number;
  dueSoon: number;
  notificationsCreated: number;
};

export function SlaAlertAction({ tenant }: SlaAlertActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SlaAlertResult | null>(null);

  async function checkSla() {
    setLoading(true);

    const response = await fetch(`/api/tenant/${tenant}/support/sla-alerts`, {
      method: "POST",
    });

    if (response.ok) {
      setResult((await response.json()) as SlaAlertResult);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={checkSla}
        disabled={loading}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verificando..." : "Verificar SLA"}
      </button>
      {result ? (
        <span className="text-xs font-medium text-slate-600">
          {result.notificationsCreated} alertas enviados | {result.overdue} vencidos |{" "}
          {result.dueSoon} proximos
        </span>
      ) : null}
    </div>
  );
}
