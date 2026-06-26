import Link from "next/link";

export default function SemAcessoPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Acesso negado
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          Seu perfil nao pode abrir esta area.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          O Zap Mobili valida permissao no servidor para evitar vazamento de
          dados entre perfis e tenants.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Entrar com outra conta
        </Link>
      </section>
    </main>
  );
}
