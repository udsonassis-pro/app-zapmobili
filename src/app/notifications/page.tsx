import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/session";
import {
  countUnreadInAppNotifications,
  listUserInAppNotifications,
} from "@/server/notifications/in-app";
import { getNotificationTarget } from "@/server/notifications/metadata";
import { NotificationActions } from "./notification-actions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRideId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const rideId = (metadata as { rideId?: unknown }).rideId;
  return typeof rideId === "string" ? rideId : null;
}

export default async function NotificationsPage() {
  const session = await requireSession();
  const [notifications, unreadCount, tenant] = await Promise.all([
    listUserInAppNotifications(session.sub),
    countUnreadInAppNotifications(session.sub),
    session.tenantId
      ? prisma.tenant.findUnique({
          where: { id: session.tenantId },
          select: { slug: true },
        })
      : null,
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Central
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Notificacoes
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sessao: {session.name} | {unreadCount} nao lidas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
          >
            Inicio
          </Link>
          <NotificationActions all disabled={unreadCount === 0} />
          <LogoutButton />
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Ultimas atualizacoes
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => {
            const unread = !notification.readAt;
            const rideId = getRideId(notification.metadata);
            const target = getNotificationTarget(notification.metadata, {
              roles: session.roles,
              tenantSlug: tenant?.slug,
            });

            return (
              <article
                key={notification.id}
                className={`grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] ${
                  unread ? "bg-amber-50/60" : "bg-white"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950">
                      {notification.title}
                    </h3>
                    {unread ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                        Nova
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {notification.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                    <span>{formatDate(notification.createdAt)}</span>
                    {rideId ? <span>Corrida: {rideId}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  {target ? (
                    <Link
                      href={target.href}
                      className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
                    >
                      {target.label}
                    </Link>
                  ) : null}
                  <NotificationActions
                    notificationId={notification.id}
                    disabled={!unread}
                  />
                </div>
              </article>
            );
          })}
          {notifications.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-600">
              Nenhuma notificacao registrada ainda.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
