# n8n — Lista de espera Claude Academy

Fluxo que recebe as inscrições do formulário, grava na planilha e avisa no Slack.

## Fluxo de dados

```
Formulário → /api/waitlist (valida, rate-limit, honeypot)
          → POST n8n webhook (payload estruturado)
          → Normalizar → Salvar na planilha → Avisar no Slack → Responder OK
```

A API local (`src/app/api/waitlist/route.ts`) continua sendo o ponto de entrada:
faz validação, rate-limit e filtro de spam, e só então encaminha um JSON limpo
para o n8n. O webhook do n8n nunca fica exposto no cliente.

- **Webhook de produção:** `https://flowhook.chatjuridico.com/webhook/formulario/waitlist-claude-academy`
- **Override local:** `N8N_WAITLIST_WEBHOOK_URL` no `.env` (ex.: instância de teste).

## Payload recebido pelo webhook (em `body`)

```json
{
  "origem": "claude-academy",
  "recebido_em": "2026-06-10T12:00:00.000Z",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "whatsapp": "+55 11 99999-8888",
  "whatsapp_ddi": "+55",
  "whatsapp_digits": "5511999998888",
  "is_client": false,
  "cliente_label": "Não",
  "pagina": "/",
  "referrer": "",
  "url_params": "?utm_source=instagram",
  "utm_source": "instagram",
  "utm_medium": "",
  "utm_campaign": ""
}
```

## Importar e configurar

1. No n8n: **Workflows → Import from File** → `waitlist-claude-academy.json`.
2. **Salvar na planilha** (Google Sheets):
   - Conecte/selecione a credencial do Google.
   - Troque `COLE_AQUI_O_ID_DA_PLANILHA` pelo ID da planilha e selecione a aba.
   - Cabeçalho sugerido: `recebido_em | nome | email | whatsapp | cliente | pagina | utm_source | utm_medium | utm_campaign | referrer | origem`.
3. **Avisar no Slack** (HTTP Request):
   - Troque `COLE_AQUI_O_SLACK_INCOMING_WEBHOOK_URL` pelo Incoming Webhook do canal.
4. **Ative** o workflow (toggle no topo). Enquanto inativo, o webhook responde 404/503.

## Testar

```bash
curl -X POST https://flowhook.chatjuridico.com/webhook/formulario/waitlist-claude-academy \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Teste","email":"teste@exemplo.com","whatsapp":"+55 11 99999-8888","cliente_label":"Não","pagina":"/","utm_source":"teste"}'
```

Espera-se `{"ok": true}`, uma nova linha na planilha e a mensagem no Slack.
