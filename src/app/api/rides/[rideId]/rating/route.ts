import { requireSession } from "@/server/auth/session";
import {
  submitRideRating,
  submitRideRatingSchema,
} from "@/server/rides/ratings";

type RatingRouteProps = {
  params: Promise<{ rideId: string }>;
};

export async function POST(request: Request, { params }: RatingRouteProps) {
  const session = await requireSession();
  const { rideId } = await params;
  const body = await request.json();
  const parsed = submitRideRatingSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Informe uma nota de 1 a 5." },
      { status: 400 },
    );
  }

  try {
    const rating = await submitRideRating(session.sub, rideId, parsed.data);
    return Response.json({ rating });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel registrar a avaliacao.",
      },
      { status: 400 },
    );
  }
}
