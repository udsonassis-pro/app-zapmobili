import { describe, expect, it } from "vitest";
import { createRideRequestSchema } from "@/server/rides/create-ride-schema";

describe("createRideRequestSchema", () => {
  it("aceita uma solicitacao valida", () => {
    const parsed = createRideRequestSchema.parse({
      vehicleCategoryId: "cat_123",
      originAddress: "Av. Paulista, 1000",
      destinationAddress: "Aeroporto de Congonhas",
      originLat: -23.565,
      originLng: -46.651,
      destinationLat: -23.626111,
      destinationLng: -46.656389,
      estimatedDistanceKm: 8.4,
      estimatedDurationMin: 22,
      paymentMethod: "PIX",
    });

    expect(parsed.paymentMethod).toBe("PIX");
  });

  it("rejeita distancia invalida", () => {
    const parsed = createRideRequestSchema.safeParse({
      vehicleCategoryId: "cat_123",
      originAddress: "Av. Paulista, 1000",
      destinationAddress: "Aeroporto de Congonhas",
      originLat: -23.565,
      originLng: -46.651,
      destinationLat: -23.626111,
      destinationLng: -46.656389,
      estimatedDistanceKm: 0,
      estimatedDurationMin: 22,
      paymentMethod: "PIX",
    });

    expect(parsed.success).toBe(false);
  });

  it("exige categoria de veiculo", () => {
    const parsed = createRideRequestSchema.safeParse({
      originAddress: "Av. Paulista, 1000",
      destinationAddress: "Aeroporto de Congonhas",
      originLat: -23.565,
      originLng: -46.651,
      destinationLat: -23.626111,
      destinationLng: -46.656389,
      estimatedDistanceKm: 8.4,
      estimatedDurationMin: 22,
      paymentMethod: "PIX",
    });

    expect(parsed.success).toBe(false);
  });
});
