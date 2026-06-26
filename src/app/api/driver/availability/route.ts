import { requireAnyRole } from "@/server/auth/session";
import {
  updateDriverAvailability,
  updateDriverAvailabilitySchema,
} from "@/server/drivers/availability";

export async function POST(request: Request) {
  const session = await requireAnyRole(["DRIVER"]);
  const body = await request.json();
  const parsed = updateDriverAvailabilitySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Disponibilidade invalida para motorista." },
      { status: 400 },
    );
  }

  try {
    const driver = await updateDriverAvailability(session.sub, parsed.data);

    return Response.json({
      driver: {
        id: driver.id,
        name: driver.user.name,
        status: driver.status,
        availability: driver.availability,
        balance: Number(driver.wallet?.balance ?? 0),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar disponibilidade.",
      },
      { status: 400 },
    );
  }
}
