import { requireSession } from "@/server/auth/session";
import {
  cancelUserRide,
  cancelUserRideSchema,
} from "@/server/rides/user-cancel";

type CancelRideRouteProps = {
  params: Promise<{ rideId: string }>;
};

export async function POST(request: Request, { params }: CancelRideRouteProps) {
  const session = await requireSession();
  const { rideId } = await params;
  const body = await request.json();
  const parsed = cancelUserRideSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Motivo de cancelamento invalido." },
      { status: 400 },
    );
  }

  try {
    const ride = await cancelUserRide(session.sub, rideId, parsed.data);
    return Response.json({ ride });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel cancelar a corrida.",
      },
      { status: 400 },
    );
  }
}
