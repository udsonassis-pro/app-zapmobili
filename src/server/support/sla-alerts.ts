import { prisma } from "@/lib/prisma";
import { createInAppNotification } from "@/server/notifications/in-app";
import {
  getSupportPriorityLabel,
  getSupportSlaAlertType,
  getSupportSlaStatus,
} from "@/server/support/support-rules";

export async function notifyTenantSupportSlaRisks(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const [tickets, recipients] = await Promise.all([
    prisma.supportTicket.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 100,
      include: {
        requester: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        roles: {
          some: {
            name: { in: ["SUPER_ADMIN", "TENANT_ADMIN", "OPERATOR", "SUPPORT"] },
          },
        },
        OR: [{ tenantId: tenant.id }, { tenantId: null }],
      },
      select: { id: true },
    }),
  ]);

  let overdue = 0;
  let dueSoon = 0;
  let created = 0;

  for (const ticket of tickets) {
    const event = getSupportSlaAlertType({
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });

    if (!event) {
      continue;
    }

    const sla = getSupportSlaStatus({
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });
    const isOverdue = event === "SUPPORT_SLA_OVERDUE";

    if (isOverdue) {
      overdue += 1;
    } else {
      dueSoon += 1;
    }

    for (const recipient of recipients) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: recipient.id,
          channel: "IN_APP",
          AND: [
            { metadata: { path: ["ticketId"], equals: ticket.id } },
            { metadata: { path: ["event"], equals: event } },
          ],
        },
        select: { id: true },
      });

      if (alreadyNotified) {
        continue;
      }

      await createInAppNotification({
        tenantId: tenant.id,
        userId: recipient.id,
        title: isOverdue ? "SLA de suporte vencido" : "SLA perto do vencimento",
        body: `${ticket.subject} | ${getSupportPriorityLabel(ticket.priority)} | prazo ${sla.dueAt.toLocaleString("pt-BR")}.`,
        metadata: {
          ticketId: ticket.id,
          rideId: ticket.rideId,
          event,
          dueAt: sla.dueAt.toISOString(),
          priority: ticket.priority,
        },
      });
      created += 1;
    }
  }

  return {
    checked: tickets.length,
    recipients: recipients.length,
    overdue,
    dueSoon,
    notificationsCreated: created,
  };
}

export async function notifyAllTenantsSupportSlaRisks() {
  const tenants = await prisma.tenant.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] }, deletedAt: null },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });

  const results = [];

  for (const tenant of tenants) {
    const result = await notifyTenantSupportSlaRisks(tenant.slug);
    results.push({ tenant: tenant.slug, ...result });
  }

  return {
    tenants: results.length,
    checked: results.reduce((total, result) => total + result.checked, 0),
    overdue: results.reduce((total, result) => total + result.overdue, 0),
    dueSoon: results.reduce((total, result) => total + result.dueSoon, 0),
    notificationsCreated: results.reduce(
      (total, result) => total + result.notificationsCreated,
      0,
    ),
    results,
  };
}
