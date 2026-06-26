const money = (value: number) => Math.round(value * 100) / 100;

export function calculateDriverEarning(input: {
  total: number;
  platformCommission: number;
  tenantCommission: number;
}) {
  return money(input.total - input.platformCommission - input.tenantCommission);
}
