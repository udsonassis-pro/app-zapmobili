import { requireSession } from "@/server/auth/session";
import {
  countUnreadInAppNotifications,
  listUserInAppNotifications,
  markAllInAppNotificationsAsRead,
  markInAppNotificationAsRead,
} from "@/server/notifications/in-app";

export async function GET() {
  const session = await requireSession();
  const [notifications, unreadCount] = await Promise.all([
    listUserInAppNotifications(session.sub),
    countUnreadInAppNotifications(session.sub),
  ]);

  return Response.json({
    unreadCount,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  const body = (await request.json().catch(() => ({}))) as {
    notificationId?: string;
    all?: boolean;
  };

  const result = body.all
    ? await markAllInAppNotificationsAsRead(session.sub)
    : body.notificationId
      ? await markInAppNotificationAsRead(session.sub, body.notificationId)
      : null;

  if (!result) {
    return Response.json(
      { error: "Informe a notificacao ou marque todas." },
      { status: 400 },
    );
  }

  return Response.json({ updated: result.count });
}
