# Checklist de Producao

- Pre-deploy automatizado aprovado:

```bash
npm run predeploy -- producao
```

- Build aprovado.
- Testes essenciais passando.
- Migrations aplicadas no banco correto.
- Variaveis por ambiente conferidas.
- Seed desativado em producao.
- Sentry ativo.
- Logs estruturados ativos.
- Backups do PostgreSQL ativos.
- Redis e realtime gerenciados.
- Gateway de pagamento em modo producao.
- Webhooks cadastrados e assinados.
- Politica de privacidade publicada.
- Termos de uso publicados.
- Plano de rollback testado.
- Monitoramento de pagamentos, corridas e erros criticos.

## Pre-deploy por ambiente

Antes de subir homologacao:

```bash
npm run db:use -- homolog
npm run app:url -- https://homolog.seudominio.com
npm run predeploy -- homolog
npm run db:deploy
```

Antes de subir producao:

```bash
npm run db:use -- producao --confirm-producao
npm run app:url -- https://app.seudominio.com
npm run predeploy -- producao
npm run db:deploy -- --confirm-producao
```

O pre-deploy valida ambiente ativo, variaveis obrigatorias, status das
migrations, testes, lint, build e configuracao basica do cron. Ele nao exibe
usuario nem senha do banco.
