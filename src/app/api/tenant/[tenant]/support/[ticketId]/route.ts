import { requireTenantRole } from "@/server/auth/session";
import { updateTenantSupportTicket } from "@/server/support/ride-support";
import { updateSupportTicketSchema } from "@/server/support/support-rules";

type SupportTicketRouteProps = {
  params: Promise<{ tenant: string; ticketId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: SupportTicketRouteProps,
) {
  const { tenant, ticketId } = await params;
  const session = await requireTenantRole(tenant, [
    "TENANT_ADMIN",
    "OPERATOR",
    "SUPPORT",
  ]);
  const body = await request.json();
  const parsed = updateSupportTicketSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Atualizacao de chamado invalida." },
      { status: 400 },
    );
  }

  try {
    const ticket = await updateTenantSupportTicket(
      tenant,
      ticketId,
      parsed.data,
      session.sub,
    );
    return Response.json({ ticket });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o chamado.",
      },
      { status: 400 },
    );
  }
}
