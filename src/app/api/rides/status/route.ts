import { z } from "zod";
import {
  canTransitionRide,
  rideStatuses,
  type RideStatus,
} from "@/server/rides/status";

const statusPayloadSchema = z.object({
  from: z.enum(rideStatuses),
  to: z.enum(rideStatuses),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = statusPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Status de corrida invalido", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const from = parsed.data.from as RideStatus;
  const to = parsed.data.to as RideStatus;

  return Response.json({
    allowed: canTransitionRide(from, to),
    from,
    to,
  });
}
