import { z } from "zod";

export const paymentRequestSchema = z.object({
  tenantId: z.string().min(1),
  rideId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["CASH", "PIX", "CARD", "WALLET", "INVOICED"]),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export type PaymentResult = {
  provider: string;
  providerRef: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED";
  amount: number;
};

export interface PaymentGateway {
  charge(input: PaymentRequest): Promise<PaymentResult>;
}

export class MockPaymentGateway implements PaymentGateway {
  async charge(input: PaymentRequest): Promise<PaymentResult> {
    const parsed = paymentRequestSchema.parse(input);

    return {
      provider: "mock",
      providerRef: `mock_${parsed.rideId}_${Date.now()}`,
      status: parsed.method === "CASH" ? "PENDING" : "PAID",
      amount: parsed.amount,
    };
  }
}

export function getPaymentGateway(): PaymentGateway {
  return new MockPaymentGateway();
}
