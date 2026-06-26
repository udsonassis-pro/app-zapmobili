# Ambientes na Vercel

## Decisao

O Zap Mobili deve rodar na Vercel em tres projetos separados:

- `zapmobili-develop`: ambiente de desenvolvimento remoto.
- `zapmobili-homolog`: ambiente de homologacao.
- `zapmobili`: ambiente de producao.

Essa separacao reduz o risco de misturar banco, secrets, dominios e jobs de
cron entre ambientes.

## Branches sugeridas

- `develop` publica em `zapmobili-develop`.
- `homolog` publica em `zapmobili-homolog`.
- `main` publica em `zapmobili`.

## Dominios sugeridos

- Develop: `https://dev.seudominio.com`
- Homologacao: `https://homolog.seudominio.com`
- Producao: `https://app.seudominio.com`

Tambem e possivel usar os dominios padrao da Vercel enquanto os dominios
proprios ainda nao estiverem configurados.

## Variaveis por projeto

Cada projeto da Vercel deve ter seu proprio conjunto de variaveis:

### zapmobili-develop

- `DATABASE_URL`: credencial do banco `zapmobili_develop`.
- `APP_URL`: URL publica do projeto develop.
- `NEXT_PUBLIC_APP_URL`: mesma URL publica do projeto develop.
- `AUTH_SECRET`: segredo exclusivo de develop.
- `CRON_SECRET`: segredo exclusivo de develop.
- `NEXT_PUBLIC_APP_NAME`: `Zap Mobili`.
- `REDIS_URL`: Redis de develop, se disponivel.
- `PAYMENT_PROVIDER`: `mock`.
- `REALTIME_PROVIDER`: `mock` ou sandbox.
- `LOG_LEVEL`: `debug`.

### zapmobili-homolog

- `DATABASE_URL`: credencial do banco `zapmobili_homolog`.
- `APP_URL`: URL publica do projeto homolog.
- `NEXT_PUBLIC_APP_URL`: mesma URL publica do projeto homolog.
- `AUTH_SECRET`: segredo exclusivo de homologacao.
- `CRON_SECRET`: segredo exclusivo de homologacao.
- `CRONJOB_API_KEY`: chave da cron-job.org, se o job for configurado por API.
- `NEXT_PUBLIC_APP_NAME`: `Zap Mobili`.
- `REDIS_URL`: Redis de homologacao.
- `PAYMENT_PROVIDER`: sandbox do gateway, ou `mock` enquanto pagamentos reais nao forem validados.
- `PAYMENT_WEBHOOK_SECRET`: segredo de webhook sandbox, quando houver gateway.
- `REALTIME_PROVIDER`: provider sandbox, ou `mock` enquanto tempo real gerenciado nao for validado.
- `SENTRY_DSN`: projeto Sentry de homologacao, se ja estiver configurado.
- `LOG_LEVEL`: `info`.

### zapmobili

- `DATABASE_URL`: credencial do banco `zapmobili`.
- `APP_URL`: URL publica de producao.
- `NEXT_PUBLIC_APP_URL`: mesma URL publica de producao.
- `AUTH_SECRET`: segredo exclusivo de producao.
- `CRON_SECRET`: segredo exclusivo de producao.
- `CRONJOB_API_KEY`: chave da cron-job.org.
- `NEXT_PUBLIC_APP_NAME`: `Zap Mobili`.
- `REDIS_URL`: Redis de producao.
- `PAYMENT_PROVIDER`: provider real de pagamento.
- `PAYMENT_WEBHOOK_SECRET`: segredo real de webhook.
- `REALTIME_PROVIDER`: provider real de tempo real.
- `REALTIME_API_KEY`: chave real do provider de tempo real.
- `SENTRY_DSN`: projeto Sentry de producao.
- `LOG_LEVEL`: `info`.

## Configuracao de build

Em todos os projetos Vercel:

- Framework: Next.js.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: padrao do Next.js.

## Fluxo local antes de publicar develop

```bash
npm run db:use -- develop
npm run app:url -- https://dev.seudominio.com
npm run predeploy -- develop
```

Depois, publicar a branch `develop` no projeto `zapmobili-develop`.

## Fluxo local antes de publicar homologacao

```bash
npm run db:use -- homolog
npm run app:url -- https://homolog.seudominio.com
npm run predeploy -- homolog
npm run db:deploy
```

Depois, publicar a branch `homolog` no projeto `zapmobili-homolog`.

## Fluxo local antes de publicar producao

```bash
npm run db:use -- producao --confirm-producao
npm run app:url -- https://app.seudominio.com
npm run predeploy -- producao
npm run db:deploy -- --confirm-producao
```

Depois, publicar a branch `main` no projeto `zapmobili`.

## Ordem recomendada de liberacao

1. Publicar develop.
2. Validar login, dashboard, passageiro, motorista e suporte.
3. Publicar homologacao.
4. Rodar validacao completa com dados ficticios.
5. Configurar cron-job.org apontando para homologacao.
6. Publicar producao apenas depois de pagamentos, realtime, Redis, Sentry e backups estarem configurados.

## Rotas minimas para validar

- `/login`
- `/admin`
- `/t/demo/dashboard`
- `/t/demo/dispatch`
- `/t/demo/support`
- `/t/demo/finance`
- `/driver`
- `/app/request`
- `/notifications`
- `/api/cron/support-sla-alerts`
