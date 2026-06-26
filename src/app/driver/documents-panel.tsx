"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type DriverDocument = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  reviewNote: string | null;
};

type DocumentsPanelProps = {
  documents: DriverDocument[];
};

export function DocumentsPanel({ documents }: DocumentsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/driver/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formData.get("type"),
        fileUrl: formData.get("fileUrl"),
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel enviar documento.");
      return;
    }

    setMessage(`Documento enviado: ${payload.document.type}.`);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Documentos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Envie links temporarios ate integrarmos Blob/S3.
          </p>
        </div>
      </div>

      <form onSubmit={submitDocument} className="mt-5 grid gap-4 md:grid-cols-[180px_1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select
            name="type"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="CNH"
          >
            <option value="CNH">CNH</option>
            <option value="CRLV">CRLV</option>
            <option value="SELFIE">Selfie</option>
            <option value="COMPROVANTE_RESIDENCIA">Comprovante</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">URL do arquivo</span>
          <input
            name="fileUrl"
            type="url"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
            defaultValue="https://example.com/documento-demo.pdf"
            required
          />
        </label>
        <button
          disabled={loading}
          className="self-end rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {documents.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">
            Nenhum documento enviado ainda.
          </p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="grid gap-2 p-4 text-sm md:grid-cols-[160px_140px_1fr]"
            >
              <span className="font-semibold text-slate-950">
                {document.type}
              </span>
              <span className="font-medium text-slate-700">{document.status}</span>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-teal-700"
              >
                {document.fileUrl}
              </a>
              {document.reviewNote ? (
                <p className="md:col-span-3 text-slate-600">
                  Observacao: {document.reviewNote}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
