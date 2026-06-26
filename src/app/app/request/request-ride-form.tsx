"use client";

import { FormEvent, useState } from "react";

type RideCreated = {
  id: string;
  status: string;
  category: string;
  estimatedPrice: number;
};

type RequestRideCategory = {
  id: string;
  name: string;
  description: string | null;
  seats: number;
  acceptsMoto: boolean;
  estimateTotal: number;
};

type RequestRideFormProps = {
  categories: RequestRideCategory[];
};

export function RequestRideForm({ categories }: RequestRideFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ride, setRide] = useState<RideCreated | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setRide(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleCategoryId: formData.get("vehicleCategoryId"),
        originAddress: formData.get("originAddress"),
        destinationAddress: formData.get("destinationAddress"),
        originLat: -23.565,
        originLng: -46.651,
        destinationLat: -23.626111,
        destinationLng: -46.656389,
        estimatedDistanceKm: 8.4,
        estimatedDurationMin: 22,
        paymentMethod: formData.get("paymentMethod"),
      }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel solicitar a corrida.");
      return;
    }

    setRide(payload.ride);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Origem</span>
          <input
            name="originAddress"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="Av. Paulista, 1000"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Destino</span>
          <input
            name="destinationAddress"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="Aeroporto de Congonhas"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Categoria</span>
          <select
            name="vehicleCategoryId"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} -{" "}
                {category.estimateTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </option>
            ))}
          </select>
          {selectedCategory ? (
            <span className="text-xs text-slate-500">
              {selectedCategory.seats} lugares |{" "}
              {selectedCategory.acceptsMoto ? "Moto" : "Carro"} | Estimativa{" "}
              {selectedCategory.estimateTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          ) : null}
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Pagamento</span>
          <select
            name="paymentMethod"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="PIX"
          >
            <option value="PIX">PIX</option>
            <option value="CASH">Dinheiro</option>
            <option value="CARD">Cartao</option>
            <option value="WALLET">Carteira</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {ride ? (
        <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Corrida criada: <strong>{ride.id}</strong>. Status:{" "}
          <strong>{ride.status}</strong>. Categoria: <strong>{ride.category}</strong>.
        </div>
      ) : null}

      <button
        disabled={loading || categories.length === 0}
        className="mt-6 w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Solicitando..." : "Solicitar motorista"}
      </button>
    </form>
  );
}
