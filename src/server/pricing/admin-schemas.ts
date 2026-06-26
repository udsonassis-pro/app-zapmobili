import { z } from "zod";

export const createVehicleCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(250).optional(),
  seats: z.number().int().min(1).max(8),
  acceptsMoto: z.boolean().default(false),
});

export const publishFareRuleSchema = z.object({
  name: z.string().min(2).max(80),
  baseFare: z.number().nonnegative(),
  pricePerKm: z.number().nonnegative(),
  pricePerMinute: z.number().nonnegative(),
  minimumFare: z.number().nonnegative(),
  cancellationFee: z.number().nonnegative().default(0),
  platformCommissionRate: z.number().min(0).max(1),
  tenantCommissionRate: z.number().min(0).max(1),
});

export type CreateVehicleCategoryInput = z.infer<
  typeof createVehicleCategorySchema
>;
export type PublishFareRuleInput = z.infer<typeof publishFareRuleSchema>;

export function commissionPercentToRate(value: number) {
  return Math.round((value / 100) * 10000) / 10000;
}

export function commissionRateToPercent(value: number) {
  return Math.round(value * 10000) / 100;
}
