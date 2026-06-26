# Zap Mobili

Plataforma SaaS white-label e multi-tenant para mobilidade urbana, criada para operadores de transporte, cooperativas, taxis, mototaxis, frotas e transporte executivo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod
- Vitest
- Vercel

## Primeiros Passos

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Configure `DATABASE_URL_DEVELOP`, `DATABASE_URL_HOMOLOG` e
`DATABASE_URL_PRODUCAO` no `.env`. Depois escolha o banco ativo antes de rodar
migrations ou seed:

```bash
npm run db:use -- develop
npm run app:url -- http://localhost:3000 --allow-http
```

```bash
npm run db:migrate
npm run db:seed
npm run test
npm run build
```

Antes de subir para homologacao ou producao, rode o pre-deploy:

```bash
npm run db:use -- homolog
npm run app:url -- https://homolog.seudominio.com
npm run predeploy -- homolog
```

Os comandos `db:migrate` e `db:seed` sao bloqueados fora de desenvolvimento.
Para aplicar migrations em homologacao ou producao, use `npm run db:deploy`.
Em producao, confirme explicitamente:

```bash
npm run db:deploy -- --confirm-producao
```

Usuarios seed:

- Super Admin: `admin@zapmobili.com.br`
- Passageiro demo: `passageiro@demo.com`
- Motorista demo: `motorista@demo.com`
- Senha: `ZapMobili@123`

## Rotas Iniciais

- `/`: entrada do produto.
- `/login`: autenticacao por e-mail e senha.
- `/admin`: painel SaaS global protegido por `SUPER_ADMIN`.
- `/t/demo/dashboard`: painel do tenant demo protegido por perfis administrativos.
- `/t/demo/finance`: painel financeiro do tenant para decidir repasses.
- `/t/demo/drivers/documents`: revisao de documentos de motoristas.
- `/app/request`: PWA inicial do passageiro protegido por `PASSENGER`.
- `/driver`: PWA inicial do motorista protegido por `DRIVER`.
- `/sem-acesso`: destino para perfil sem permissao.
- `/api/auth/login`: cria sessao HTTP-only.
- `/api/auth/logout`: encerra sessao.
- `/api/auth/me`: retorna a sessao atual.
- `/api/rides`: cria uma corrida real para o passageiro autenticado.
- `/api/driver/calls`: lista chamadas disponiveis para o motorista autenticado.
- `/api/driver/calls/[rideId]/accept`: aceita uma chamada e vincula motorista/veiculo.
- `/api/driver/rides/[rideId]/action`: avanca a corrida ativa do motorista; ao concluir, processa pagamento mock e carteira.
- `/api/driver/payouts`: lista e solicita repasses da carteira do motorista.
- `/api/driver/documents`: lista e envia documentos do motorista.
- `/api/tenant/[tenant]/payouts`: lista repasses do tenant.
- `/api/tenant/[tenant]/payouts/[payoutId]/decision`: aprova ou rejeita repasse.
- `/api/tenant/[tenant]/driver-documents`: lista documentos dos motoristas.
- `/api/tenant/[tenant]/driver-documents/[documentId]/review`: aprova ou rejeita documento.
- `/api/cron/support-sla-alerts`: verifica SLA de suporte em todos os tenants, protegido por `CRON_SECRET`.
- `/api/rides/estimate`: estimativa de preco.
- `/api/rides/status`: validacao de transicao de status.
- `/api/tenant/resolve`: resolucao de tenant por host.

## Documentos

- [PLANO-TECNICO.md](./PLANO-TECNICO.md)
- [Deploy na Vercel](./docs/DEPLOY-VERCEL.md)
- [Ambientes na Vercel](./docs/VERCEL-AMBIENTES.md)
- [Agendamento externo com cron-job.org](./docs/CRON-JOB-ORG.md)
- [Ambientes](./docs/AMBIENTES.md)
- [Checklist de seguranca](./docs/SEGURANCA.md)
- [Checklist de producao](./docs/PRODUCAO.md)

## Status

Esta e a primeira base funcional: arquitetura, schema Prisma, seed, autenticacao, guards por perfil, criacao persistida de corrida, aceite pelo motorista, execucao operacional ate `COMPLETED`, pagamento mock, credito de carteira, solicitacao e decisao de repasse, envio/revisao de documentos, painel do tenant com dados reais, regras centrais, APIs iniciais e telas navegaveis. As proximas fases devem evoluir aprovacao completa de motoristas/veiculos, permissoes granulares por tenant, tempo real gerenciado e pagamentos reais.
