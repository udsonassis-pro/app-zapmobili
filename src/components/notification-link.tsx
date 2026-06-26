import Link from "next/link";

type NotificationLinkProps = {
  unreadCount: number;
};

export function NotificationLink({ unreadCount }: NotificationLinkProps) {
  return (
    <Link
      href="/notifications"
      className="relative rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-700"
    >
      Notificacoes
      {unreadCount > 0 ? (
        <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
