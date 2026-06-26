import { calculateRidePrice, priceEstimateInputSchema } from "@/server/pricing/pricing";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = priceEstimateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para estimativa", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return Response.json({
    estimate: calculateRidePrice(parsed.data),
  });
}
