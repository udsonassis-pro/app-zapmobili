import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StatCard } from "@/components/stat-card";
import { requireTenantRole } from "@/server/auth/session";
import { listTenantSupportTickets } from "@/server/support/ride-support";
import { getSupportPriorityLabel } from "@/server/support/support-rules";
import { resolveTenantFromRoute } from "@/server/tenancy/tenant-resolver";
import { SlaAlertAction } from "./sla-alert-action";
import { SupportTicketActions } from "./support-ticket-actions";

export const dynamic = "force-dynamic";

type TenantSupportPageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ status?: string }>;
};

function dateTime(value: Date | string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function TenantSupportPage({
  params,
  searchParams,
}: TenantSupportPageProps) {
  const { tenant } = await params;
  const filters = await searchParams;
  const tenantContext = resolveTenantFromRoute(tenant);
  const session = await requireTenantRole(tenantContext.slug, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const result = await listTenantSupportTickets(tenantContext.slug, filters);
  const openTickets = result.tickets.filter((ticket) => ticket.status === "OPEN").length;
  const activeTickets = result.tickets.filter((ticket) =>
    ["OPEN", "IN_PROGRESS"].includes(ticket.status),
  ).length;
  const criticalTickets = result.tickets.filter((ticket) => ticket.priority >= 4).length;
  const overdueTickets = result.tickets.filter((ticket) => ticket.sla.overdue).length;
  const onTrackTickets = activeTickets - overdueTickets;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tenant: {tenantContext.slug}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Suporte e incidentes
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/t/${tenantContext.slug}/dashboard`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Dashboard
          </Link>
          <Link
            href={`/t/${tenantContext.slug}/dispatch`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Despacho
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SlaAlertAction tenant={tenantContext.slug} />
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[220px_120px]">
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todos os status</option>
          <option value="OPEN">Aberto</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="RESOLVED">Resolvido</option>
          <option value="CLOSED">Fechado</option>
        </select>
        <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          Filtrar
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Chamados" value={`${result.tickets.length}`} detail="Chamados no filtro atual." />
        <StatCard label="Abertos" value={`${openTickets}`} detail="Aguardando primeira acao." />
        <StatCard label="Ativos" value={`${activeTickets}`} detail="Abertos ou em andamento." />
        <StatCard label="Vencidos" value={`${overdueTickets}`} detail={`${onTrackTickets} ativos dentro do prazo.`} />
        <StatCard label="Criticos" value={`${criticalTickets}`} detail="Prioridade critica." />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Chamados recentes
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {result.tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="grid gap-4 px-5 py-4 text-sm lg:grid-cols-[1fr_220px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">
                    {ticket.subject}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {ticket.status}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {getSupportPriorityLabel(ticket.priority)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ticket.sla.overdue
                        ? "bg-red-100 text-red-800"
                        : ticket.sla.closed
                          ? "bg-slate-100 text-slate-600"
                          : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {ticket.sla.overdue
                      ? "SLA vencido"
                      : ticket.sla.closed
                        ? "SLA encerrado"
                        : "No prazo"}
                  </span>
                </div>
                <p className="mt-2 leading-6 text-slate-700">
                  {ticket.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Solicitante: {ticket.requester.name}</span>
                  <span>{dateTime(ticket.createdAt)}</span>
                  <span>Prazo: {dateTime(ticket.sla.dueAt)}</span>
                  {ticket.rideId ? (
                    <Link
                      href={`/t/${tenantContext.slug}/rides/${ticket.rideId}`}
                      className="font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Ver corrida
                    </Link>
                  ) : null}
                </div>
                {ticket.ride ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Passageiro: {ticket.ride.passenger.user.name} | Motorista:{" "}
                    {ticket.ride.driver?.user.name ?? "Sem motorista"}
                  </p>
                ) : null}
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Historico
                  </p>
                  <div className="mt-2 grid gap-2">
                    {ticket.events.map((event) => (
                      <div key={event.id} className="text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {event.action} | {dateTime(event.createdAt)}
                        </p>
                        <p className="mt-1">
                          {event.actor?.name ?? "Sistema"}
                          {event.fromStatus || event.toStatus
                            ? ` | Status: ${event.fromStatus ?? "-"} -> ${
                                event.toStatus ?? "-"
                              }`
                            : ""}
                          {event.fromPriority || event.toPriority
                            ? ` | Prioridade: ${event.fromPriority ?? "-"} -> ${
                                event.toPriority ?? "-"
                              }`
                            : ""}
                        </p>
                        {event.note ? (
                          <p className="mt-1 text-slate-500">{event.note}</p>
                        ) : null}
                      </div>
                    ))}
                    {ticket.events.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Sem eventos registrados.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <SupportTicketActions
                tenant={tenantContext.slug}
                ticketId={ticket.id}
                status={ticket.status}
                priority={ticket.priority}
              />
            </article>
          ))}
          {result.tickets.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              Nenhum chamado encontrado.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
