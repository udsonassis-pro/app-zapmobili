import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Zap Mobili
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          Acesse sua conta
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use os usuarios seed para validar os perfis iniciais da plataforma.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p>
            Super Admin: <strong>admin@zapmobili.com.br</strong>
          </p>
          <p>
            Passageiro: <strong>passageiro@demo.com</strong>
          </p>
          <p>
            Motorista: <strong>motorista@demo.com</strong>
          </p>
        </div>

        <Link
          href="/"
          className="mt-5 inline-block text-sm font-medium text-teal-700"
        >
          Voltar ao inicio
        </Link>
      </section>
    </main>
  );
}
