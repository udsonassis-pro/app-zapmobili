export const rideStatuses = [
  "REQUESTED",
  "SEARCHING_DRIVER",
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVING",
  "DRIVER_ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED_BY_PASSENGER",
  "CANCELED_BY_DRIVER",
  "CANCELED_BY_SYSTEM",
  "PAYMENT_PENDING",
  "PAYMENT_FAILED",
  "PAID",
] as const;

export type RideStatus = (typeof rideStatuses)[number];

const terminalStatuses: RideStatus[] = [
  "CANCELED_BY_PASSENGER",
  "CANCELED_BY_DRIVER",
  "CANCELED_BY_SYSTEM",
  "PAID",
];

const transitions: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ["SEARCHING_DRIVER", "CANCELED_BY_PASSENGER", "CANCELED_BY_SYSTEM"],
  SEARCHING_DRIVER: [
    "DRIVER_ASSIGNED",
    "CANCELED_BY_PASSENGER",
    "CANCELED_BY_SYSTEM",
  ],
  DRIVER_ASSIGNED: [
    "DRIVER_ARRIVING",
    "CANCELED_BY_PASSENGER",
    "CANCELED_BY_DRIVER",
    "CANCELED_BY_SYSTEM",
  ],
  DRIVER_ARRIVING: [
    "DRIVER_ARRIVED",
    "CANCELED_BY_PASSENGER",
    "CANCELED_BY_DRIVER",
    "CANCELED_BY_SYSTEM",
  ],
  DRIVER_ARRIVED: [
    "IN_PROGRESS",
    "CANCELED_BY_PASSENGER",
    "CANCELED_BY_DRIVER",
    "CANCELED_BY_SYSTEM",
  ],
  IN_PROGRESS: ["COMPLETED", "CANCELED_BY_SYSTEM"],
  COMPLETED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAID", "PAYMENT_FAILED"],
  PAYMENT_FAILED: ["PAYMENT_PENDING", "CANCELED_BY_SYSTEM"],
  CANCELED_BY_PASSENGER: [],
  CANCELED_BY_DRIVER: [],
  CANCELED_BY_SYSTEM: [],
  PAID: [],
};

export function canTransitionRide(from: RideStatus, to: RideStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function assertRideTransition(from: RideStatus, to: RideStatus) {
  if (!canTransitionRide(from, to)) {
    throw new Error(`Transicao de corrida invalida: ${from} -> ${to}`);
  }
}

export function isTerminalRideStatus(status: RideStatus) {
  return terminalStatuses.includes(status);
}
