"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SupportTicketPanelProps = {
  rideId: string;
};

export function SupportTicketPanel({ rideId }: SupportTicketPanelProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function openTicket() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const response = await fetch(`/api/rides/${rideId}/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, priority }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(payload.error ?? "Nao foi possivel abrir o chamado.");
      setLoading(false);
      return;
    }

    setSubject("");
    setDescription("");
    setPriority(2);
    setSuccess(true);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Suporte</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Abra um chamado vinculado a esta corrida para acompanhamento da operacao.
      </p>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Assunto
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-700"
          placeholder="Ex.: Problema no embarque"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Descricao
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-700"
          placeholder="Descreva o que aconteceu"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Prioridade
        <select
          value={priority}
          onChange={(event) => setPriority(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-700"
        >
          <option value={1}>Baixa</option>
          <option value={2}>Normal</option>
          <option value={3}>Alta</option>
          <option value={4}>Critica</option>
        </select>
      </label>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm font-medium text-teal-700">
          Chamado aberto com sucesso.
        </p>
      ) : null}
      <button
        type="button"
        onClick={openTicket}
        disabled={loading || subject.trim().length < 5 || description.trim().length < 10}
        className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Abrindo..." : "Abrir chamado"}
      </button>
    </div>
  );
}
