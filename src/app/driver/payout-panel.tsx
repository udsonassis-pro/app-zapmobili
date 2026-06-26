"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Payout = {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
};

type PayoutPanelProps = {
  balance: number;
  blockedAmount: number;
  availableBalance: number;
  payouts: Payout[];
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PayoutPanel({
  balance,
  blockedAmount,
  availableBalance,
  payouts,
}: PayoutPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/driver/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(formData.get("amount")),
        pixKey: String(formData.get("pixKey") ?? ""),
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel solicitar repasse.");
      return;
    }

    setMessage(`Repasse solicitado: ${currency(payload.payout.amount)}.`);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Carteira e repasses
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Solicite saque do saldo disponivel.
          </p>
        </div>
        <strong className="text-lg text-slate-950">
          {currency(availableBalance)}
        </strong>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-slate-500">Saldo total</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {currency(balance)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-slate-500">Bloqueado</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {currency(blockedAmount)}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-slate-500">Disponivel</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {currency(availableBalance)}
          </dd>
        </div>
      </dl>

      <form onSubmit={submitPayout} className="mt-5 grid gap-4 md:grid-cols-[160px_1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Valor</span>
          <input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            max={availableBalance}
            defaultValue={Math.min(50, availableBalance).toFixed(2)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Chave PIX</span>
          <input
            name="pixKey"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="motorista@demo.com"
          />
        </label>
        <button
          disabled={loading || availableBalance <= 0}
          className="self-end rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Solicitando..." : "Solicitar"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {payouts.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">
            Nenhum repasse solicitado ainda.
          </p>
        ) : (
          payouts.map((payout) => (
            <div
              key={payout.id}
              className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_120px_140px]"
            >
              <span className="font-medium text-slate-950">{payout.id}</span>
              <span className="text-slate-700">{currency(payout.amount)}</span>
              <span className="font-medium text-slate-700">{payout.status}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
