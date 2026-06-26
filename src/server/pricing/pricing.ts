import { z } from "zod";

export const fareRuleSchema = z.object({
  baseFare: z.number().nonnegative(),
  pricePerKm: z.number().nonnegative(),
  pricePerMinute: z.number().nonnegative(),
  minimumFare: z.number().nonnegative(),
  platformCommissionRate: z.number().min(0).max(1),
  tenantCommissionRate: z.number().min(0).max(1),
});

export const priceEstimateInputSchema = z.object({
  distanceKm: z.number().positive(),
  durationMinutes: z.number().positive(),
  discount: z.number().nonnegative().default(0),
  manualAddition: z.number().nonnegative().default(0),
  fareRule: fareRuleSchema,
});

export type PriceEstimateInput = z.input<typeof priceEstimateInputSchema>;

export type PriceEstimate = {
  subtotal: number;
  discount: number;
  manualAddition: number;
  total: number;
  platformCommission: number;
  tenantCommission: number;
  driverEarning: number;
};

const money = (value: number) => Math.round(value * 100) / 100;

export function calculateRidePrice(input: PriceEstimateInput): PriceEstimate {
  const parsed = priceEstimateInputSchema.parse(input);
  const rawSubtotal =
    parsed.fareRule.baseFare +
    parsed.distanceKm * parsed.fareRule.pricePerKm +
    parsed.durationMinutes * parsed.fareRule.pricePerMinute;

  const subtotal = Math.max(rawSubtotal, parsed.fareRule.minimumFare);
  const total = Math.max(0, subtotal + parsed.manualAddition - parsed.discount);
  const platformCommission = total * parsed.fareRule.platformCommissionRate;
  const tenantCommission = total * parsed.fareRule.tenantCommissionRate;

  return {
    subtotal: money(subtotal),
    discount: money(parsed.discount),
    manualAddition: money(parsed.manualAddition),
    total: money(total),
    platformCommission: money(platformCommission),
    tenantCommission: money(tenantCommission),
    driverEarning: money(total - platformCommission - tenantCommission),
  };
}
