export function canApproveDriver(input: {
  approvedDocuments: number;
  approvedVehicles: number;
}) {
  return input.approvedDocuments > 0 && input.approvedVehicles > 0;
}

export function assertCanApproveDriver(input: {
  approvedDocuments: number;
  approvedVehicles: number;
}) {
  if (!canApproveDriver(input)) {
    throw new Error(
      "Motorista precisa ter ao menos um documento e um veiculo aprovados.",
    );
  }
}
