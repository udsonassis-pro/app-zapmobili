import { requireAnyRole } from "@/server/auth/session";
import { listAvailableRideCategoriesForUser } from "@/server/rides/available-categories";

const defaultEstimateInput = {
  distanceKm: 8.4,
  durationMinutes: 22,
};

export async function GET() {
  const session = await requireAnyRole(["PASSENGER"]);
  const categories = await listAvailableRideCategoriesForUser(
    session.sub,
    defaultEstimateInput,
  );

  return Response.json({
    categories: categories.map(({ category, fareRule, estimate }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      seats: category.seats,
      acceptsMoto: category.acceptsMoto,
      fareRule: {
        id: fareRule.id,
        baseFare: Number(fareRule.baseFare),
        pricePerKm: Number(fareRule.pricePerKm),
        pricePerMinute: Number(fareRule.pricePerMinute),
        minimumFare: Number(fareRule.minimumFare),
      },
      estimate,
    })),
  });
}
