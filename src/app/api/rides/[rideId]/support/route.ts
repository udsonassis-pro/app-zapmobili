import { requireSession } from "@/server/auth/session";
import {
  createRideSupportTicket,
} from "@/server/support/ride-support";
import { createRideSupportTicketSchema } from "@/server/support/support-rules";

type RideSupportRouteProps = {
  params: Promise<{ rideId: string }>;
};

export async function POST(request: Request, { params }: RideSupportRouteProps) {
  const session = await requireSession();
  const { rideId } = await params;
  const body = await request.json();
  const parsed = createRideSupportTicketSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Informe assunto, descricao e prioridade validos." },
      { status: 400 },
    );
  }

  try {
    const ticket = await createRideSupportTicket(session.sub, rideId, parsed.data);
    return Response.json({ ticket });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel abrir o chamado.",
      },
      { status: 400 },
    );
  }
}
