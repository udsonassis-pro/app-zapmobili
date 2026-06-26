"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
