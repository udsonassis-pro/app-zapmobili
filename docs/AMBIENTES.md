# Ambientes

## Desenvolvimento

- Local: `APP_URL=http://localhost:3000`
- Vercel: projeto `zapmobili-develop`, branch `develop`.
- Logs detalhados.
- Banco local ou remoto de desenvolvimento.
- Seed liberado.
- Gateway mock.
- Realtime mock ou sandbox.

## Homologacao

- Vercel: projeto `zapmobili-homolog`, branch `homolog`.
- Banco staging.
- Redis staging.
- Gateway em sandbox.
- Dados ficticios.
- Testes de fluxo completo antes de producao.

## Producao

- Vercel: projeto `zapmobili`, branch `main`.
- Banco separado.
- Redis separado.
- Sentry ativo.
- Backups do banco.
- Secrets apenas na Vercel.
- Webhooks assinados.
- Seeds bloqueados.

## Alternar banco ativo

O Prisma usa `DATABASE_URL` como banco ativo. Para evitar edicao manual do `.env`,
configure tambem `DATABASE_URL_DEVELOP`, `DATABASE_URL_HOMOLOG` e
`DATABASE_URL_PRODUCAO`, depois alterne com:

```bash
npm run db:use -- develop
npm run db:use -- homolog
npm run db:use -- producao --confirm-producao
```

O comando atualiza apenas `DATABASE_URL`, remove duplicidade dessa chave e nao
exibe usuario ou senha no terminal.

## Configurar URL publica do app

Para homologacao e producao, `APP_URL` e `NEXT_PUBLIC_APP_URL` precisam apontar
para uma URL HTTPS publica:

```bash
npm run app:url -- https://homolog.seudominio.com
```

Para voltar ao ambiente local:

```bash
npm run app:url -- http://localhost:3000 --allow-http
```

Antes de rodar migrations, confirme o ambiente ativo:

```bash
npm run db:use -- develop
npm run db:migrate
```

Em homologacao e producao, prefira migrations versionadas:

```bash
npm run db:deploy
```

Para producao, o deploy de migrations exige confirmacao explicita:

```bash
npm run db:use -- producao --confirm-producao
npm run db:deploy -- --confirm-producao
```

## Protecoes dos comandos de banco

- `npm run db:migrate` roda `prisma migrate dev` apenas em desenvolvimento.
- `npm run db:seed` roda em desenvolvimento e homologacao.
- `npm run db:seed -- --confirm-producao` roda em producao apos confirmacao explicita.
- `npm run db:deploy` roda em desenvolvimento e homologacao.
- `npm run db:deploy -- --confirm-producao` roda em producao apos confirmacao.
- Os comandos exibem apenas host e banco, nunca usuario ou senha.

Nunca rode seed em producao sem confirmacao explicita.

## Vercel

O guia completo dos tres projetos Vercel esta em
[VERCEL-AMBIENTES.md](./VERCEL-AMBIENTES.md).
