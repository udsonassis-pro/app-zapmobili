export function canDispatchDriver(input: {
  driverStatus: string;
  availability: string;
  hasApprovedVehicleForCategory: boolean;
}) {
  return (
    input.driverStatus === "APPROVED" &&
    input.availability === "ONLINE" &&
    input.hasApprovedVehicleForCategory
  );
}

export function assertCanDispatchDriver(input: {
  driverStatus: string;
  availability: string;
  hasApprovedVehicleForCategory: boolean;
}) {
  if (!canDispatchDriver(input)) {
    throw new Error(
      "Motorista precisa estar aprovado, online e com veiculo aprovado na categoria da corrida.",
    );
  }
}
