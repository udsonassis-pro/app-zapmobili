const money = (value: number) => Math.round(value * 100) / 100;

export function calculateAvailableBalance(input: {
  balance: number;
  blockedAmount: number;
}) {
  return money(Math.max(0, input.balance - input.blockedAmount));
}

export function assertPayoutAmount(input: {
  amount: number;
  availableBalance: number;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Valor de repasse invalido.");
  }

  if (input.amount > input.availableBalance) {
    throw new Error("Saldo disponivel insuficiente para repasse.");
  }
}

export function calculateWalletAfterPayoutApproval(input: {
  balance: number;
  blockedAmount: number;
  amount: number;
}) {
  assertPayoutAmount({
    amount: input.amount,
    availableBalance: input.blockedAmount,
  });

  return {
    balance: money(input.balance - input.amount),
    blockedAmount: money(input.blockedAmount - input.amount),
  };
}

export function calculateWalletAfterPayoutRejection(input: {
  balance: number;
  blockedAmount: number;
  amount: number;
}) {
  assertPayoutAmount({
    amount: input.amount,
    availableBalance: input.blockedAmount,
  });

  return {
    balance: money(input.balance),
    blockedAmount: money(input.blockedAmount - input.amount),
  };
}
