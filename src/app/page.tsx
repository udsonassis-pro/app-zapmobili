import Link from "next/link";
import { StatCard } from "@/components/stat-card";

const entryPoints = [
  {
    href: "/admin",
    title: "SaaS global",
    text: "Tenants, planos, assinaturas e auditoria da plataforma.",
  },
  {
    href: "/t/demo/dashboard",
    title: "Painel do tenant",
    text: "Operacao, motoristas, passageiros, tarifas e financeiro.",
  },
  {
    href: "/app/request",
    title: "PWA passageiro",
    text: "Solicitacao de corrida com estimativa inicial.",
  },
  {
    href: "/driver",
    title: "PWA motorista",
    text: "Disponibilidade, chamadas, ganhos e execucao da corrida.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Zap Mobili
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
              Plataforma SaaS para operacoes de transporte urbano.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Base multi-tenant para empresas, cooperativas e frotas gerirem
              corridas, motoristas, passageiros, tarifas, pagamentos e operacao
              em tempo real.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Entrar na plataforma
            </Link>
          </div>
          <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {entryPoints.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-600 hover:bg-white"
              >
                <strong className="block text-base font-semibold text-slate-950">
                  {item.title}
                </strong>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {item.text}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-8 md:grid-cols-4">
        <StatCard
          label="Tenants"
          value="Multi"
          detail="Isolamento por empresa com slug, subdominio ou dominio customizado."
        />
        <StatCard
          label="Corridas"
          value="13"
          detail="Estados previstos desde solicitacao ate pagamento final."
        />
        <StatCard
          label="Pagamentos"
          value="Mock"
          detail="Camada pronta para Mercado Pago, Asaas, Pagar.me ou Stripe."
        />
        <StatCard
          label="Tempo real"
          value="Plugavel"
          detail="Preparado para Ably, Pusher, Supabase Realtime ou Redis."
        />
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Marco inicial implementado
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Plano tecnico completo",
              "Schema Prisma multi-tenant",
              "Motor de precificacao",
              "Estados de corrida",
              "Gateway mock de pagamentos",
              "Login e guards por perfil",
            ].map((item) => (
              <div
                key={item}
                className="border-l-4 border-teal-600 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Proxima fase
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Conectar autenticacao real, persistir tenants e corridas no banco,
            aplicar guards por permissao e evoluir matching com presenca de
            motorista.
          </p>
        </div>
      </section>
    </main>
  );
}
