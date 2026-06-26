# Deploy na Vercel

## Estrategia

- Vercel sera usada para develop, homologacao e producao.
- Recomendacao: usar tres projetos Vercel separados.
- `zapmobili-develop`: branch `develop`.
- `zapmobili-homolog`: branch `homolog`.
- `zapmobili`: branch `main`.
- Cada projeto deve ter banco, Redis, secrets, dominios e gateways separados.

Guia completo: [Ambientes na Vercel](./VERCEL-AMBIENTES.md).

## Variaveis

Obrigatorias:

- `DATABASE_URL`
- `APP_URL`
- `AUTH_SECRET`
- `CRON_SECRET`
- `REDIS_URL`
- `PAYMENT_PROVIDER`
- `REALTIME_PROVIDER`

Para listar as variaveis esperadas por ambiente:

```bash
npm run vercel:env -- develop
npm run vercel:env -- homolog
npm run vercel:env -- producao
```

Para sincronizar as variaveis do `.env` local para a Vercel sem exibir os
valores:

```bash
npm run vercel:env:sync
```

O script usa `DATABASE_URL_DEVELOP`, `DATABASE_URL_HOMOLOG` e
`DATABASE_URL_PRODUCAO` para configurar os ambientes correspondentes.

Recomendadas:

- `SENTRY_DSN`
- `BLOB_READ_WRITE_TOKEN`
- `PAYMENT_WEBHOOK_SECRET`

## Banco

Use PostgreSQL gerenciado. Para deploy:

```bash
npm run predeploy -- homolog
npm run db:deploy
npm run build
```

Seeds devem rodar apenas em desenvolvimento ou homologacao.

## Cron externo de SLA

Use um agendador externo, como cron-job.org, para chamar periodicamente:

```text
GET https://SEU_DOMINIO/api/cron/support-sla-alerts?secret=$CRON_SECRET
```

Sugestao inicial: a cada 15 minutos. O job percorre tenants ativos/trial e cria alertas in-app de chamados de suporte com SLA vencido ou perto do vencimento.

Guia detalhado: [Agendamento externo com cron-job.org](./CRON-JOB-ORG.md).

## Fluxo de homologacao

No checkout local, prepare homologacao com:

```bash
npm run db:use -- homolog
npm run app:url -- https://homolog.seudominio.com
npm run predeploy -- homolog
npm run db:deploy
```

Depois valide no navegador:

- `/login`
- `/t/demo/dashboard`
- `/t/demo/support`
- `/driver`
- `/app/request`

## Fluxo de develop na Vercel

```bash
npm run db:use -- develop
npm run app:url -- https://dev.seudominio.com
npm run predeploy -- develop
```

Depois publique a branch `develop` no projeto Vercel `zapmobili-develop`.

## Fluxo de producao na Vercel

```bash
npm run db:use -- producao --confirm-producao
npm run app:url -- https://app.seudominio.com
npm run predeploy -- producao
npm run db:deploy -- --confirm-producao
```

Depois publique a branch `main` no projeto Vercel `zapmobili`.

## Tempo Real

WebSocket persistente proprio nao e ideal em funcoes serverless da Vercel. Para producao, use Ably, Pusher, Supabase Realtime ou servico dedicado, mantendo Redis para presenca, filas e estado transitorio.

## Rollback

- Reverter commit ou promover deploy anterior no painel da Vercel.
- Nunca reutilizar banco de staging em producao.
- Conferir migrations antes de promover `main`.
