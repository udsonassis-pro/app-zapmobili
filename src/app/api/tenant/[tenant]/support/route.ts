import { requireTenantRole } from "@/server/auth/session";
import { listTenantSupportTickets } from "@/server/support/ride-support";

export async function GET(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/support">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "OPERATOR", "SUPPORT"]);
  const searchParams = new URL(request.url).searchParams;
  const result = await listTenantSupportTickets(tenant, {
    status: searchParams.get("status"),
  });

  return Response.json({
    tickets: result.tickets.map((ticket) => ({
      id: ticket.id,
      rideId: ticket.rideId,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      sla: {
        dueAt: ticket.sla.dueAt,
        overdue: ticket.sla.overdue,
        closed: ticket.sla.closed,
        remainingHours: ticket.sla.remainingHours,
      },
      requester: ticket.requester.name,
      createdAt: ticket.createdAt,
    })),
  });
}
