export function getRideDisplayPrice(input: {
  estimatedPrice: number;
  finalPrice: number | null;
}) {
  return input.finalPrice ?? input.estimatedPrice;
}

export function canCancelFromDetails(status: string) {
  return [
    "SEARCHING_DRIVER",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
  ].includes(status);
}

export function canUserCancelRide(viewerRole: "PASSENGER" | "DRIVER", status: string) {
  if (viewerRole === "PASSENGER") {
    return [
      "REQUESTED",
      "SEARCHING_DRIVER",
      "DRIVER_ASSIGNED",
      "DRIVER_ARRIVING",
      "DRIVER_ARRIVED",
    ].includes(status);
  }

  return ["DRIVER_ASSIGNED", "DRIVER_ARRIVING", "DRIVER_ARRIVED"].includes(
    status,
  );
}

export function canUserRateRide(input: {
  status: string;
  hasTarget: boolean;
  alreadyRated: boolean;
}) {
  return (
    input.hasTarget &&
    !input.alreadyRated &&
    ["COMPLETED", "PAYMENT_PENDING", "PAID"].includes(input.status)
  );
}
