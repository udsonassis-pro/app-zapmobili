export function canSetDriverOnline(input: {
  status: string;
  approvedVehicles: number;
  currentAvailability: string;
}) {
  return (
    input.status === "APPROVED" &&
    input.approvedVehicles > 0 &&
    input.currentAvailability !== "BUSY"
  );
}

export function canSetDriverOffline(input: { currentAvailability: string }) {
  return input.currentAvailability !== "BUSY";
}

export function assertCanSetDriverAvailability(input: {
  targetAvailability: "ONLINE" | "OFFLINE";
  status: string;
  approvedVehicles: number;
  currentAvailability: string;
}) {
  if (
    input.targetAvailability === "ONLINE" &&
    !canSetDriverOnline({
      status: input.status,
      approvedVehicles: input.approvedVehicles,
      currentAvailability: input.currentAvailability,
    })
  ) {
    throw new Error(
      "Motorista precisa estar aprovado, livre e com veiculo aprovado para ficar online.",
    );
  }

  if (
    input.targetAvailability === "OFFLINE" &&
    !canSetDriverOffline({
      currentAvailability: input.currentAvailability,
    })
  ) {
    throw new Error("Motorista em corrida nao pode ficar offline.");
  }
}
