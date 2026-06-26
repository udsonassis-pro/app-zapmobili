# Zap Mobili - Plano Tecnico

## 1. Visao do Produto

Zap Mobili e uma plataforma SaaS white-label e multi-tenant para operadores de mobilidade urbana, incluindo taxis, mototaxis, cooperativas, transporte executivo, frotas e operadores locais.

O produto tera tres superficies principais:

- Painel SaaS global para gestao da plataforma.
- Painel administrativo do tenant para operacao da empresa.
- PWAs para passageiro e motorista, preparados para evoluir para apps React Native/Expo usando a mesma API.

Dominio principal: `zapmobili.com.br`.

## 2. Stack Tecnica

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Redis para cache, filas, presenca e eventos operacionais.
- Ably, Pusher, Supabase Realtime ou servico equivalente para tempo real persistente em producao na Vercel.
- Auth.js ou autenticacao propria com cookies HTTP-only, bcrypt/argon2 e validacao de sessao no servidor.
- Zod para validacao de entrada.
- Vercel para desenvolvimento remoto, preview, homologacao e producao.
- Vercel Blob ou S3 compativel para arquivos.
- Sentry para erros.
- Logs estruturados.
- Gateway de pagamento desacoplado, com mock inicial e adaptadores para Mercado Pago, Asaas, Pagar.me ou Stripe.

## 3. Estrategia de Ambientes

### Desenvolvimento

- Execucao local com `npm run dev`.
- Banco PostgreSQL local ou banco remoto de desenvolvimento.
- Redis local ou servico gerenciado de desenvolvimento.
- Seeds com tenants, usuarios, motoristas, passageiros, tarifas e corridas ficticias.
- Logs detalhados.

### Homologacao

- Vercel Preview Deployments.
- Banco de staging separado.
- Redis/staging separado.
- Gateways em sandbox.
- Dados ficticios.
- Testes de fluxo completo antes de promover para producao.

### Producao

- Vercel Production.
- Banco PostgreSQL gerenciado.
- Redis gerenciado.
- Sentry ativo.
- Variaveis seguras no painel da Vercel.
- Backups do banco.
- Politica de rollback via GitHub/Vercel.
- Observabilidade de APIs, pagamentos, webhooks e eventos de corrida.

## 4. Arquitetura

Camadas principais:

- `app/`: rotas, layouts e paginas do App Router.
- `components/`: componentes visuais reutilizaveis.
- `lib/`: infraestrutura compartilhada, autenticacao, tenant resolver, prisma, validacoes e utilitarios.
- `modules/`: dominios de negocio isolados.
- `server/`: servicos de aplicacao, casos de uso, autorizacao e integrações.
- `prisma/`: schema, migrations e seed.
- `tests/`: testes unitarios e de integracao.

Modulos de dominio:

- `auth`: login, sessao, senha, usuarios e permissoes.
- `tenancy`: resolucao de tenant, isolamento e configuracoes.
- `saas-admin`: planos, assinaturas, tenants e operacao global.
- `tenant-admin`: operacao administrativa do cliente.
- `passenger`: perfil, enderecos, corridas e pagamentos.
- `driver`: documentos, veiculos, status, chamadas e carteira.
- `rides`: solicitacao, matching, estados, historico e precificacao.
- `payments`: pagamentos, webhooks, reembolsos, carteira e repasses.
- `realtime`: presenca, localizacao, eventos e notificacoes ao vivo.
- `geo`: geocoding, rotas, areas de atendimento e motoristas proximos.
- `notifications`: e-mail, push, in-app e eventos operacionais.
- `audit`: logs administrativos, rastreabilidade e LGPD.
- `support`: chamados, mensagens e historico.
- `reports`: indicadores operacionais e financeiros.

## 5. Multi-tenancy

Estrategia inicial:

- Cada registro sensivel deve carregar `tenantId` quando pertencer a um operador.
- Rotas administrativas de tenant devem resolver o tenant por subdominio, dominio customizado ou segmento de rota.
- Toda consulta de dados de tenant deve filtrar por `tenantId` no servidor.
- Super Admin pode operar fora de um tenant especifico, mas toda acao deve ser auditada.
- Admin de tenant nunca pode acessar dados de outro tenant.

Resolucao de tenant:

- `app.zapmobili.com.br`: SaaS global.
- `{slug}.zapmobili.com.br`: ambiente white-label do tenant.
- Dominio customizado: resolvido por `Tenant.domain`.
- Desenvolvimento: `localhost:3000/t/{slug}`.

## 6. Permissoes

Perfis iniciais:

- `SUPER_ADMIN`: administra o SaaS inteiro.
- `TENANT_ADMIN`: administra uma empresa.
- `OPERATOR`: acompanha operacao e corridas.
- `FINANCE`: acessa pagamentos, comissoes e repasses.
- `SUPPORT`: atende chamados e consulta dados limitados.
- `DRIVER`: usa o PWA do motorista.
- `PASSENGER`: usa o PWA do passageiro.

Autorizacao:

- Validacao no servidor em cada action/API.
- Checagem de role e permissoes por tenant.
- Auditoria de acoes sensiveis.
- Protecao contra enumeracao por IDs de outro tenant.

## 7. Modelo de Dados

Entidades minimas:

- `Tenant`: empresa cliente, marca, dominio, status e dados de operacao.
- `TenantSetting`: configuracoes flexiveis por tenant.
- `SubscriptionPlan`: planos SaaS.
- `TenantSubscription`: assinatura do tenant.
- `User`: usuario global com e-mail, senha e status.
- `Role`: papel por usuario e tenant.
- `Permission`: permissoes granulares.
- `PassengerProfile`: dados do passageiro.
- `DriverProfile`: dados do motorista, status operacional e avaliacao.
- `DriverDocument`: documentos enviados e aprovacao.
- `Vehicle`: veiculo do motorista.
- `VehicleCategory`: categorias e regras de veiculo.
- `FareRule`: regras de tarifa.
- `Ride`: corrida principal.
- `RideStatusHistory`: historico auditavel de estados.
- `RideLocation`: trilha e eventos de localizacao.
- `Payment`: pagamentos e status financeiro.
- `Wallet`: carteira do motorista.
- `WalletTransaction`: movimentacoes da carteira.
- `DriverPayout`: repasses ao motorista.
- `Coupon`: cupons e descontos.
- `Rating`: avaliacoes.
- `SupportTicket`: chamados de suporte.
- `Notification`: notificacoes.
- `AuditLog`: auditoria administrativa e operacional.

Padroes:

- IDs CUID/UUID.
- `createdAt`, `updatedAt` e `deletedAt` quando fizer sentido.
- Indices por `tenantId`, status, datas e relacionamentos frequentes.
- Decimal para valores monetarios.
- Enums para status e tipos.

## 8. Fluxo da Corrida

1. Passageiro informa origem e destino.
2. Sistema calcula estimativa com distancia e duracao.
3. Passageiro solicita corrida.
4. Corrida entra em `REQUESTED` e depois `SEARCHING_DRIVER`.
5. Sistema localiza motoristas online proximos e compativeis.
6. Motoristas recebem chamada com timeout.
7. Motorista aceita ou recusa.
8. Corrida muda para `DRIVER_ASSIGNED`.
9. Motorista se desloca ate a origem.
10. Corrida muda para `DRIVER_ARRIVING` e `DRIVER_ARRIVED`.
11. Motorista inicia a corrida.
12. Corrida muda para `IN_PROGRESS`.
13. Localizacao e status sao transmitidos em tempo real.
14. Motorista finaliza.
15. Sistema calcula valor final.
16. Pagamento e processado.
17. Comissoes e carteira sao atualizadas.
18. Passageiro e motorista avaliam.

Estados:

- `REQUESTED`
- `SEARCHING_DRIVER`
- `DRIVER_ASSIGNED`
- `DRIVER_ARRIVING`
- `DRIVER_ARRIVED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELED_BY_PASSENGER`
- `CANCELED_BY_DRIVER`
- `CANCELED_BY_SYSTEM`
- `PAYMENT_PENDING`
- `PAYMENT_FAILED`
- `PAID`

## 9. Precificacao

Formula inicial:

```text
preco = tarifa_base + distancia_km * valor_por_km + duracao_minutos * valor_por_minuto
```

Regras:

- Aplicar tarifa minima.
- Aplicar cupom quando valido.
- Aplicar adicionais manuais quando autorizados.
- Registrar comissao da plataforma.
- Registrar comissao do tenant.
- Preparar campo para tarifa dinamica futura.

## 10. Pagamentos

Metodos:

- Dinheiro.
- PIX.
- Cartao.
- Carteira interna.
- Corrida faturada.

Arquitetura:

- Interface `PaymentGateway`.
- Adaptador `MockPaymentGateway` inicial.
- Adaptadores futuros para Mercado Pago, Asaas, Pagar.me e Stripe.
- Webhooks validados por assinatura.
- Status financeiro auditavel.
- Reembolso e estorno como eventos financeiros.

## 11. Tempo Real

Limitacao da Vercel:

- Funcoes serverless nao sao ideais para WebSocket persistente proprio.

Alternativa recomendada:

- Usar Ably, Pusher, Supabase Realtime ou servico dedicado.
- Redis para presenca, filas, estado transitorio e coordenacao.
- APIs Next.js publicam eventos; cliente assina canais por tenant, corrida e usuario.

Eventos:

- Motorista online/offline.
- Atualizacao de localizacao.
- Chamada de corrida.
- Aceite/recusa.
- Mudanca de estado.
- Timeout de aceite.
- Atualizacoes para passageiro, motorista e painel.

## 12. Mapas e Geolocalizacao

Interface `GeoProvider`:

- Autocomplete.
- Geocoding.
- Reverse geocoding.
- Calculo de rota.
- Distancia.
- Duracao.
- Area de atendimento.
- Busca por motoristas proximos.

Adaptadores futuros:

- Google Maps.
- Mapbox.
- OpenStreetMap/OSRM.

## 13. Rotas

### Publicas

- `/`
- `/login`
- `/cadastro`
- `/termos`
- `/privacidade`

### SaaS Global

- `/admin`
- `/admin/tenants`
- `/admin/plans`
- `/admin/subscriptions`
- `/admin/audit`
- `/admin/settings`

### Tenant Admin

- `/t/[tenant]/dashboard`
- `/t/[tenant]/rides`
- `/t/[tenant]/drivers`
- `/t/[tenant]/drivers/documents`
- `/t/[tenant]/passengers`
- `/t/[tenant]/vehicles`
- `/t/[tenant]/categories`
- `/t/[tenant]/fares`
- `/t/[tenant]/finance`
- `/t/[tenant]/payments`
- `/t/[tenant]/payouts`
- `/t/[tenant]/coupons`
- `/t/[tenant]/support`
- `/t/[tenant]/reports`
- `/t/[tenant]/settings`
- `/t/[tenant]/users`
- `/t/[tenant]/audit`

### Passageiro

- `/app`
- `/app/request`
- `/app/ride/[id]`
- `/app/history`
- `/app/payments`
- `/app/support`
- `/app/profile`

### Motorista

- `/driver`
- `/driver/documents`
- `/driver/vehicle`
- `/driver/calls`
- `/driver/ride/[id]`
- `/driver/wallet`
- `/driver/payouts`
- `/driver/history`
- `/driver/profile`

### APIs

- `/api/auth/*`
- `/api/tenants/*`
- `/api/rides/*`
- `/api/drivers/*`
- `/api/passengers/*`
- `/api/payments/*`
- `/api/webhooks/payments/*`
- `/api/realtime/*`
- `/api/geo/*`
- `/api/support/*`

## 14. UI e PWA

Principios:

- Interface operacional, clara e densa para administracao.
- PWA de passageiro com foco em solicitar e acompanhar corrida.
- PWA de motorista com foco em disponibilidade, chamada e execucao.
- Design responsivo.
- Manifest e metadados para instalacao.
- Estados vazios, loading, erro e permissao negada.

## 15. Seguranca

Obrigatorio:

- Senhas com hash forte.
- Cookies HTTP-only e secure em producao.
- Validacao Zod em toda entrada.
- Rate limit em login, solicitacao de corrida e webhooks.
- Protecao cross-tenant no backend.
- Logs de auditoria.
- Nenhum segredo hardcoded.
- Sanitizacao de dados.
- Assinatura de webhooks.
- MFA preparado para admins.
- Headers de seguranca.
- Tratamento padronizado de erros.

## 16. LGPD

Preparar:

- Politica de privacidade.
- Termos de uso.
- Consentimento.
- Exportacao de dados do usuario.
- Exclusao ou anonimizacao.
- Retencao de dados.
- Auditoria de acesso.
- Protecao especial para localizacao e documentos.

## 17. Testes

Essenciais:

- Calculo de preco.
- Transicoes validas de status de corrida.
- Autorizacao multi-tenant.
- Criacao de corrida.
- Matching inicial.
- Processamento mock de pagamento.
- Webhook mock.
- Permissoes por role.

Ferramentas:

- Vitest para unitarios.
- Testes de integracao para APIs e services.
- Playwright em fase posterior para fluxos criticos.

## 18. Deploy Vercel

Checklist:

- Projeto conectado ao GitHub.
- Branch `develop` com previews.
- Branch `main` com producao.
- Variaveis separadas por ambiente.
- Banco separado por ambiente.
- Redis separado por ambiente.
- Sentry configurado.
- `DATABASE_URL` e `DIRECT_URL` definidos.
- `NEXTAUTH_SECRET` ou segredo equivalente definido.
- `APP_URL` definido por ambiente.
- Gateways em sandbox/staging/producao.
- `prisma migrate deploy` no processo de release.

## 19. Checklist de Producao

- Build limpo.
- Testes essenciais passando.
- Migrations aplicadas.
- Seed apenas em dev/staging.
- Logs e Sentry ativos.
- Rate limit ativo.
- Backups definidos.
- Webhooks validados.
- Politicas LGPD publicadas.
- Plano de rollback documentado.
- Monitoramento de pagamentos e corridas.
- Revisao de permissoes.

## 20. Fases de Implementacao

### Fase 1 - Planejamento tecnico

- Criar este plano.
- Validar stack e arquitetura.
- Definir modelo de dados e rotas.

### Fase 2 - Base do projeto

- Criar Next.js, TypeScript e Tailwind.
- Configurar Prisma e PostgreSQL.
- Criar `.env.example`.
- Criar layout base e navegacao inicial.
- Criar scripts de desenvolvimento, build, lint, seed e testes.

### Fase 3 - Multi-tenancy

- Criar schema de tenant.
- Resolver tenant por rota, dominio e subdominio.
- Criar guardas server-side.
- Criar painel SaaS global inicial.

### Fase 4 - Cadastros principais

- Passageiros.
- Motoristas.
- Documentos.
- Veiculos.
- Categorias.
- Tarifas.

### Fase 5 - Motor de corrida

- Criar solicitacao.
- Implementar estimativa.
- Implementar estados.
- Implementar matching inicial.
- Implementar historico.

### Fase 6 - Tempo real

- Abstracao de eventos.
- Presenca de motorista.
- Publicacao de status e localizacao.
- Painel ao vivo.

### Fase 7 - Financeiro

- Pagamentos mock.
- Carteira.
- Comissoes.
- Repasses.
- Relatorios financeiros.

### Fase 8 - Interfaces finais

- PWA passageiro.
- PWA motorista.
- Painel tenant.
- Painel SaaS.

### Fase 9 - Producao

- Testes ampliados.
- Hardening de seguranca.
- Monitoramento.
- Documentacao final.
- Deploy Vercel.

## 21. Primeira Versao Funcional Recomendada

O primeiro marco comercial deve conter:

- SaaS global com tenants e planos.
- Tenant admin com motoristas, passageiros, tarifas e corridas.
- PWA passageiro solicitando corrida com preco estimado.
- PWA motorista aceitando uma chamada simulada.
- Status da corrida funcional.
- Pagamento mock.
- Carteira do motorista.
- Logs de auditoria.
- Seed demonstravel.
- Deploy preview na Vercel.

