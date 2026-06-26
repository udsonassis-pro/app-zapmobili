"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RatingPanelProps = {
  rideId: string;
  viewerRole: "PASSENGER" | "DRIVER";
  targetName: string;
};

export function RatingPanel({
  rideId,
  viewerRole,
  targetName,
}: RatingPanelProps) {
  const router = useRouter();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitRating() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/rides/${rideId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error ?? "Nao foi possivel registrar a avaliacao.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Avaliar corrida</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {viewerRole === "PASSENGER"
          ? `Avalie o motorista ${targetName}.`
          : `Avalie o passageiro ${targetName}.`}
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Nota
        <select
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-700"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} estrela{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Comentario
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-700"
          placeholder="Opcional"
        />
      </label>

      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={submitRating}
        disabled={loading}
        className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar avaliacao"}
      </button>
    </div>
  );
}
