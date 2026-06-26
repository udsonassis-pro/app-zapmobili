export function buildRideNotificationMetadata(input: {
  rideId: string;
  status: string;
  event: string;
}) {
  return {
    rideId: input.rideId,
    status: input.status,
    event: input.event,
  };
}

export type NotificationTargetContext = {
  roles: string[];
  tenantSlug?: string | null;
};

export function getNotificationTarget(
  metadata: unknown,
  context: NotificationTargetContext,
) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const typedMetadata = metadata as {
    rideId?: unknown;
    ticketId?: unknown;
    event?: unknown;
  };
  const rideId = typedMetadata.rideId;
  const ticketId = typedMetadata.ticketId;
  const event = typedMetadata.event;

  const hasTenantAccess = context.roles.some((role) =>
    ["SUPER_ADMIN", "TENANT_ADMIN", "OPERATOR", "FINANCE", "SUPPORT"].includes(
      role,
    ),
  );

  if (
    typeof ticketId === "string" &&
    typeof event === "string" &&
    event.startsWith("SUPPORT_") &&
    hasTenantAccess &&
    context.tenantSlug
  ) {
    return {
      href: `/t/${context.tenantSlug}/support`,
      label: "Ver suporte",
    };
  }

  if (typeof rideId !== "string" || typeof event !== "string") {
    return null;
  }

  if (hasTenantAccess && context.tenantSlug) {
    return {
      href: `/t/${context.tenantSlug}/rides/${rideId}`,
      label: "Ver corrida",
    };
  }

  if (event.endsWith("_DRIVER") || event === "DRIVER_ARRIVING") {
    return {
      href: `/rides/${rideId}`,
      label: "Ver corrida",
    };
  }

  if (event.endsWith("_PASSENGER") || event === "RIDE_CREATED") {
    return {
      href: `/rides/${rideId}`,
      label: "Ver corrida",
    };
  }

  return null;
}
