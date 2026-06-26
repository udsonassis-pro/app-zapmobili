import { prisma } from "@/lib/prisma";
export { buildRideNotificationMetadata } from "@/server/notifications/metadata";

export type InAppNotificationInput = {
  tenantId: string;
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function createInAppNotification(input: InAppNotificationInput) {
  return prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? {},
    },
  });
}

export async function createManyInAppNotifications(
  inputs: InAppNotificationInput[],
) {
  if (inputs.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: inputs.map((input) => ({
      tenantId: input.tenantId,
      userId: input.userId,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? {},
    })),
  });
}

export async function listUserInAppNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function countUnreadInAppNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, channel: "IN_APP", readAt: null },
  });
}

export async function markInAppNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      channel: "IN_APP",
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function markAllInAppNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, channel: "IN_APP", readAt: null },
    data: { readAt: new Date() },
  });
}
