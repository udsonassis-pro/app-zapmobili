# Agendamento externo com cron-job.org

## Objetivo

Usar cron-job.org para chamar periodicamente o endpoint de SLA de suporte:

```text
GET /api/cron/support-sla-alerts
```

Esse job percorre todos os tenants `ACTIVE` e `TRIAL`, verifica chamados de suporte ativos e cria notificacoes in-app para chamados com SLA vencido ou perto do vencimento.

## Variavel obrigatoria

Configure em cada ambiente:

```text
CRON_SECRET=<segredo-forte-e-exclusivo-do-ambiente>
```

Use um valor diferente para desenvolvimento, homologacao e producao.

## URL para cron-job.org

Formato:

```text
https://SEU_DOMINIO/api/cron/support-sla-alerts?secret=CRON_SECRET
```

Exemplo:

```text
https://app.seudominio.com/api/cron/support-sla-alerts?secret=seu-segredo-forte
```

## Configuracao sugerida

- Metodo: `GET`
- Frequencia inicial: a cada 15 minutos
- Timeout: 30 segundos ou mais
- Salvar resposta: opcional
- Considerar sucesso: HTTP `200`
- Considerar falha: HTTP `401`, `500` ou timeout

## Configuracao via API

Com `CRONJOB_API_KEY`, `CRON_SECRET` e `APP_URL` configurados no `.env`, rode:

```bash
npm run cron:setup
```

O script cria ou atualiza o job chamado `Zap Mobili - SLA suporte` e agenda a execucao a cada 15 minutos.

Requisitos:

- `APP_URL` precisa ser HTTPS publico. `localhost` nao funciona na cron-job.org.
- `CRONJOB_API_KEY` e a chave da API da cron-job.org.
- `CRON_SECRET` e o segredo que protege o endpoint do app.

## Resposta esperada

```json
{
  "ok": true,
  "tenants": 1,
  "checked": 3,
  "overdue": 1,
  "dueSoon": 0,
  "notificationsCreated": 0,
  "results": []
}
```

`notificationsCreated` pode ser `0` mesmo com chamados vencidos, porque o job e idempotente e nao duplica alertas ja enviados para o mesmo usuario/chamado/evento.

## Alternativa com header

Se preferir nao colocar o segredo na URL, envie o header:

```text
Authorization: Bearer CRON_SECRET
```

Nesse caso a URL fica:

```text
https://SEU_DOMINIO/api/cron/support-sla-alerts
```

## Checklist

- Definir `CRON_SECRET` no ambiente do app.
- Usar HTTPS.
- Conferir se a URL publica responde `401` sem segredo.
- Conferir se a URL com segredo responde `200`.
- Agendar a execucao no cron-job.org.
- Verificar no painel `/t/{tenant}/support` se os alertas aparecem em notificacoes.
