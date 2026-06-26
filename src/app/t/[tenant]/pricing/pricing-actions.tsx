"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type PricingActionsProps = {
  tenant: string;
  categoryId: string;
};

export function CategoryCreateForm({ tenant }: { tenant: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/tenant/${tenant}/pricing/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        description: form.get("description") || undefined,
        seats: Number(form.get("seats")),
        acceptsMoto: form.get("acceptsMoto") === "on",
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel criar categoria.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Categoria criada.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input
        name="name"
        required
        placeholder="Nome da categoria"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
      />
      <input
        name="slug"
        required
        placeholder="slug-da-categoria"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
      />
      <input
        name="description"
        placeholder="Descricao"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
      />
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <input
          name="seats"
          required
          type="number"
          min="1"
          max="8"
          defaultValue="4"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="acceptsMoto" type="checkbox" />
          Moto
        </label>
      </div>
      <button
        disabled={loading}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Criando..." : "Criar categoria"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </form>
  );
}

export function FareRulePublishForm({ tenant, categoryId }: PricingActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `/api/tenant/${tenant}/pricing/categories/${categoryId}/fare-rules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          baseFare: Number(form.get("baseFare")),
          pricePerKm: Number(form.get("pricePerKm")),
          pricePerMinute: Number(form.get("pricePerMinute")),
          minimumFare: Number(form.get("minimumFare")),
          cancellationFee: Number(form.get("cancellationFee")),
          platformCommissionRate: Number(form.get("platformCommissionRate")) / 100,
          tenantCommissionRate: Number(form.get("tenantCommissionRate")) / 100,
        }),
      },
    );
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel publicar tarifa.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Tarifa publicada.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
      <input
        name="name"
        required
        placeholder="Nome da tarifa"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="baseFare"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Base"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="pricePerKm"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Por km"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="pricePerMinute"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Por min"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="minimumFare"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Minima"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="cancellationFee"
        required
        type="number"
        min="0"
        step="0.01"
        placeholder="Cancelamento"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="platformCommissionRate"
        required
        type="number"
        min="0"
        max="100"
        step="0.01"
        placeholder="% plataforma"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <input
        name="tenantCommissionRate"
        required
        type="number"
        min="0"
        max="100"
        step="0.01"
        placeholder="% tenant"
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
      />
      <button
        disabled={loading}
        className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-4"
      >
        {loading ? "Publicando..." : "Publicar nova tarifa"}
      </button>
      {message ? (
        <p className="text-xs text-slate-600 md:col-span-4">{message}</p>
      ) : null}
    </form>
  );
}
