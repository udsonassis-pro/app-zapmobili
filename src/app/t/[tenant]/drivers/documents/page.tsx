import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantDriverDocuments } from "@/server/drivers/documents";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import { DocumentReviewActions } from "./document-review-actions";

export const dynamic = "force-dynamic";

type TenantDriverDocumentsPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function TenantDriverDocumentsPage({
  params,
}: TenantDriverDocumentsPageProps) {
  const { tenant } = await params;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "SUPPORT",
  ]);
  const { documents } = await listTenantDriverDocuments(tenantContext.slug);
  const pending = documents.filter((document) => document.status === "PENDING");
  const approved = documents.filter((document) => document.status === "APPROVED");
  const rejected = documents.filter((document) => document.status === "REJECTED");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Documentos de motoristas
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/t/${tenantContext.slug}/dashboard`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pendentes" value={`${pending.length}`} detail="Aguardando revisao." />
        <StatCard label="Aprovados" value={`${approved.length}`} detail="Liberados para operacao." />
        <StatCard label="Rejeitados" value={`${rejected.length}`} detail="Precisam de reenvio." />
        <StatCard label="Total" value={`${documents.length}`} detail="Documentos recebidos." />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Fila de documentos
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((document) => (
            <div
              key={document.id}
              className="grid gap-4 px-5 py-4 text-sm lg:grid-cols-[1fr_120px_110px_1fr_180px]"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  {document.driver.user.name}
                </p>
                <p className="mt-1 text-slate-500">
                  {document.driver.user.email}
                </p>
              </div>
              <span className="font-semibold text-slate-950">
                {document.type}
              </span>
              <span className="font-medium text-slate-700">
                {document.status}
              </span>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-teal-700"
              >
                {document.fileUrl}
              </a>
              <DocumentReviewActions
                tenant={tenantContext.slug}
                documentId={document.id}
                disabled={document.status !== "PENDING"}
              />
              {document.reviewNote ? (
                <p className="text-slate-600 lg:col-span-5">
                  Observacao: {document.reviewNote}
                </p>
              ) : null}
            </div>
          ))}
          {documents.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhum documento enviado ainda.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
