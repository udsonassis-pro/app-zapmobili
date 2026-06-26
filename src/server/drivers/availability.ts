import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertCanSetDriverAvailability } from "@/server/drivers/availability-rules";
import { getDriverProfileForUser } from "@/server/drivers/calls";

export const updateDriverAvailabilitySchema = z.object({
  availability: z.enum(["ONLINE", "OFFLINE"]),
});

export type UpdateDriverAvailabilityInput = z.infer<
  typeof updateDriverAvailabilitySchema
>;

export async function updateDriverAvailability(
  userId: string,
  input: UpdateDriverAvailabilityInput,
) {
  const parsed = updateDriverAvailabilitySchema.parse(input);
  const driver = await getDriverProfileForUser(userId);

  assertCanSetDriverAvailability({
    targetAvailability: parsed.availability,
    status: driver.status,
    approvedVehicles: driver.vehicles.length,
    currentAvailability: driver.availability,
  });

  return prisma.driverProfile.update({
    where: { id: driver.id },
    data: { availability: parsed.availability },
    include: {
      user: { select: { name: true } },
      wallet: true,
    },
  });
}
