import { prisma } from "@/lib/prisma";
import type { SupportTicketStatus } from "@/generated/prisma/enums";
import { createManyInAppNotifications } from "@/server/notifications/in-app";
import {
  createRideSupportTicketSchema,
  getSupportSlaStatus,
  updateSupportTicketSchema,
  type CreateRideSupportTicketInput,
  type UpdateSupportTicketInput,
} from "@/server/support/support-rules";

export async function createRideSupportTicket(
  userId: string,
  rideId: string,
  input: CreateRideSupportTicketInput,
) {
  const parsed = createRideSupportTicketSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      passengerProfile: true,
      driverProfile: true,
    },
  });

  if (!user) {
    throw new Error("Usuario nao encontrado.");
  }

  const ride = await prisma.ride.findFirst({
    where: {
      id: rideId,
      OR: [
        user.passengerProfile
          ? { passengerId: user.passengerProfile.id }
          : undefined,
        user.driverProfile ? { driverId: user.driverProfile.id } : undefined,
      ].filter((filter): filter is { passengerId: string } | { driverId: string } =>
        Boolean(filter),
      ),
    },
    include: {
      passenger: { include: { user: { select: { name: true } } } },
      driver: { include: { user: { select: { name: true } } } },
    },
  });

  if (!ride) {
    throw new Error("Corrida nao encontrada.");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: ride.tenantId,
      requesterId: userId,
      rideId: ride.id,
      subject: parsed.subject,
      description: parsed.description,
      priority: parsed.priority,
      events: {
        create: {
          tenantId: ride.tenantId,
          actorId: userId,
          action: "CREATED",
          toStatus: "OPEN",
          toPriority: parsed.priority,
          note: parsed.description,
        },
      },
    },
    include: {
      requester: { select: { name: true, email: true } },
      ride: true,
    },
  });

  const tenantOperators = await prisma.user.findMany({
    where: {
      tenantId: ride.tenantId,
      status: "ACTIVE",
      deletedAt: null,
      roles: {
        some: {
          name: { in: ["TENANT_ADMIN", "OPERATOR", "SUPPORT"] },
        },
      },
    },
    select: { id: true },
  });

  await createManyInAppNotifications(
    tenantOperators.map((operator) => ({
      tenantId: ride.tenantId,
      userId: operator.id,
      title: "Novo chamado de suporte",
      body: `${user.name} abriu um chamado para a corrida ${ride.id}.`,
      metadata: {
        ticketId: ticket.id,
        rideId: ride.id,
        event: "SUPPORT_TICKET_OPENED",
      },
    })),
  );

  return ticket;
}

export async function listTenantSupportTickets(
  tenantSlug: string,
  rawFilters: { status?: string | null } = {},
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const status =
    rawFilters.status &&
    ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(rawFilters.status)
      ? (rawFilters.status as SupportTicketStatus)
      : undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: {
      tenantId: tenant.id,
      ...(status ? { status } : {}),
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      requester: { select: { name: true, email: true } },
      ride: {
        include: {
          passenger: { include: { user: { select: { name: true } } } },
          driver: { include: { user: { select: { name: true } } } },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { actor: { select: { name: true } } },
      },
    },
  });

  return {
    tenant,
    tickets: tickets.map((ticket) => ({
      ...ticket,
      sla: getSupportSlaStatus({
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      }),
    })),
    filters: { status },
  };
}

export async function getTenantSupportSummary(tenantId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      tenantId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      priority: true,
      status: true,
      createdAt: true,
    },
  });
  const ticketsWithSla = tickets.map((ticket) => ({
    ...ticket,
    sla: getSupportSlaStatus({
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
    }),
  }));

  return {
    active: ticketsWithSla.length,
    open: ticketsWithSla.filter((ticket) => ticket.status === "OPEN").length,
    critical: ticketsWithSla.filter((ticket) => ticket.priority >= 4).length,
    overdue: ticketsWithSla.filter((ticket) => ticket.sla.overdue).length,
    dueSoon: ticketsWithSla.filter(
      (ticket) =>
        !ticket.sla.closed &&
        !ticket.sla.overdue &&
        ticket.sla.remainingHours <= 1,
    ).length,
  };
}

export async function updateTenantSupportTicket(
  tenantSlug: string,
  ticketId: string,
  input: UpdateSupportTicketInput,
  actorId?: string,
) {
  const parsed = updateSupportTicketSchema.parse(input);
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId: tenant.id },
  });

  if (!ticket) {
    throw new Error("Chamado nao encontrado.");
  }

  const statusChanged =
    parsed.status !== undefined && parsed.status !== ticket.status;
  const priorityChanged =
    parsed.priority !== undefined && parsed.priority !== ticket.priority;
  const note = parsed.note?.trim();

  if (!statusChanged && !priorityChanged && !note) {
    return prisma.supportTicket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: {
        requester: { select: { name: true, email: true } },
        ride: true,
        events: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true } } },
        },
      },
    });
  }

  return prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: parsed.status,
      priority: parsed.priority,
      events: {
        create: {
          tenantId: tenant.id,
          actorId,
          action: statusChanged || priorityChanged ? "UPDATED" : "COMMENT",
          fromStatus: statusChanged ? ticket.status : null,
          toStatus: statusChanged ? parsed.status : null,
          fromPriority: priorityChanged ? ticket.priority : null,
          toPriority: priorityChanged ? parsed.priority : null,
          note: note || null,
        },
      },
    },
    include: {
      requester: { select: { name: true, email: true } },
      ride: true,
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
}
