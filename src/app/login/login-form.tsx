"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getRedirectPath(roles: string[], fallback: string | null) {
  if (fallback?.startsWith("/")) {
    return fallback;
  }

  if (roles.includes("SUPER_ADMIN")) {
    return "/admin";
  }

  if (roles.includes("DRIVER")) {
    return "/driver";
  }

  if (roles.includes("PASSENGER")) {
    return "/app/request";
  }

  return "/t/demo/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel entrar.");
      return;
    }

    router.push(getRedirectPath(payload.user.roles, searchParams.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
          defaultValue="admin@zapmobili.com.br"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-700"
          defaultValue="ZapMobili@123"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        disabled={loading}
        className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
