import { z } from "zod";

export const createRideRequestSchema = z.object({
  vehicleCategoryId: z.string().min(1),
  originAddress: z.string().min(3),
  destinationAddress: z.string().min(3),
  originLat: z.number(),
  originLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  estimatedDistanceKm: z.number().positive(),
  estimatedDurationMin: z.number().int().positive(),
  paymentMethod: z.enum(["CASH", "PIX", "CARD", "WALLET", "INVOICED"]),
});

export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
