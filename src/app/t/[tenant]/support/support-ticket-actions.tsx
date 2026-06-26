"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SupportTicketActionsProps = {
  tenant: string;
  ticketId: string;
  status: string;
  priority: number;
};

export function SupportTicketActions({
  tenant,
  ticketId,
  status,
  priority,
}: SupportTicketActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function updateTicket(input: { status?: string; priority?: number }) {
    setLoading(true);

    await fetch(`/api/tenant/${tenant}/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        note: note.trim() || undefined,
      }),
    });

    setNote("");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="grid gap-2">
      <select
        value={status}
        onChange={(event) => updateTicket({ status: event.target.value })}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
      >
        <option value="OPEN">Aberto</option>
        <option value="IN_PROGRESS">Em andamento</option>
        <option value="RESOLVED">Resolvido</option>
        <option value="CLOSED">Fechado</option>
      </select>
      <select
        value={priority}
        onChange={(event) => updateTicket({ priority: Number(event.target.value) })}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
      >
        <option value={1}>Baixa</option>
        <option value={2}>Normal</option>
        <option value={3}>Alta</option>
          <option value={4}>Critica</option>
        </select>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700"
        placeholder="Comentario interno opcional"
      />
      <button
        type="button"
        onClick={() => updateTicket({})}
        disabled={loading || note.trim().length === 0}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar comentario
      </button>
    </div>
  );
}
