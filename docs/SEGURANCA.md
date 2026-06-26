# Checklist de Seguranca

- Hash forte de senha.
- Cookies HTTP-only e secure em producao.
- Validacao Zod em APIs e actions.
- Rate limit em login, corrida e webhooks.
- Toda consulta de tenant filtrada por `tenantId`.
- Super Admin auditado em acoes sensiveis.
- Nenhum segredo hardcoded.
- Webhooks com assinatura.
- Logs sem dados sensiveis desnecessarios.
- Documentos de motoristas em storage privado.
- Preparar MFA para administradores.
- Preparar exportacao, anonimização e exclusao LGPD.
