import { describe, expect, it } from "vitest";
import {
  assertCanApproveDriver,
  canApproveDriver,
} from "@/server/drivers/operational-rules";

describe("driver operational rules", () => {
  it("libera aprovacao com documento e veiculo aprovados", () => {
    expect(
      canApproveDriver({ approvedDocuments: 1, approvedVehicles: 1 }),
    ).toBe(true);
  });

  it("bloqueia aprovacao sem documento aprovado", () => {
    expect(
      canApproveDriver({ approvedDocuments: 0, approvedVehicles: 1 }),
    ).toBe(false);
  });

  it("bloqueia aprovacao sem veiculo aprovado", () => {
    expect(
      canApproveDriver({ approvedDocuments: 1, approvedVehicles: 0 }),
    ).toBe(false);
  });

  it("explica quando motorista nao esta pronto para aprovacao", () => {
    expect(() =>
      assertCanApproveDriver({ approvedDocuments: 0, approvedVehicles: 0 }),
    ).toThrow("Motorista precisa ter ao menos um documento");
  });
});
