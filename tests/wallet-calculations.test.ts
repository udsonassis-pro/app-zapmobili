import { describe, expect, it } from "vitest";
import {
  assertPayoutAmount,
  calculateAvailableBalance,
  calculateWalletAfterPayoutApproval,
  calculateWalletAfterPayoutRejection,
} from "@/server/payments/wallet-calculations";

describe("wallet calculations", () => {
  it("calcula saldo disponivel descontando bloqueios", () => {
    expect(calculateAvailableBalance({ balance: 208.44, blockedAmount: 50 })).toBe(
      158.44,
    );
  });

  it("nunca retorna saldo disponivel negativo", () => {
    expect(calculateAvailableBalance({ balance: 10, blockedAmount: 30 })).toBe(0);
  });

  it("bloqueia repasse acima do saldo disponivel", () => {
    expect(() =>
      assertPayoutAmount({ amount: 200, availableBalance: 100 }),
    ).toThrow("Saldo disponivel insuficiente");
  });

  it("baixa saldo e bloqueado quando repasse e aprovado", () => {
    expect(
      calculateWalletAfterPayoutApproval({
        balance: 208.44,
        blockedAmount: 25,
        amount: 25,
      }),
    ).toEqual({
      balance: 183.44,
      blockedAmount: 0,
    });
  });

  it("libera bloqueado sem baixar saldo quando repasse e rejeitado", () => {
    expect(
      calculateWalletAfterPayoutRejection({
        balance: 208.44,
        blockedAmount: 25,
        amount: 25,
      }),
    ).toEqual({
      balance: 208.44,
      blockedAmount: 0,
    });
  });
});
