"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NotificationActionsProps = {
  notificationId?: string;
  all?: boolean;
  disabled?: boolean;
};

export function NotificationActions({
  notificationId,
  all = false,
  disabled = false,
}: NotificationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAsRead() {
    setLoading(true);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { notificationId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markAsRead}
      disabled={disabled || loading}
      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Atualizando..." : all ? "Marcar todas como lidas" : "Marcar como lida"}
    </button>
  );
}
