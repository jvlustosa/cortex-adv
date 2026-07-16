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
   - O mapeamento casa pelos cabeçalhos **exatos** da planilha já em uso (não renomeie):
     `Data/Hora | Nome | E-mail | WhatsApp | Cliente Chat Jurídico | Página | UTM Source | UTM Medium | UTM Campaign | Referrer`.
   - `Data/Hora` sai formatado em horário de São Paulo (`yyyy-LL-dd HH:mm:ss`) para bater com as linhas existentes.
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

---

# n8n — Convite Claude Academy pós-assinatura Asaas

Quando alguém **assina no Asaas**, este fluxo cria o convite e manda por e-mail
(SendGrid). Se o envio automático falhar, joga os dados da pessoa no Slack para
alguém **gerar o convite na mão**. Arquivo: `asaas-convite-claude-academy.json`.

## Fluxo de dados

```
Asaas (webhook PAYMENT_CONFIRMED)
  → Webhook n8n → Responder OK (200 imediato pro Asaas)
  → IF (token do webhook confere? evento = PAYMENT_CONFIRMED? descrição contém "Claude"?)
      → Buscar cliente na API Asaas (pega e-mail + nome)
      → Emitir convite: POST /api/invites/issue (cria token + envia e-mail)
      → Avisar no Slack:  ✅ enviado  |  ⚠️ falhou → gere na mão (dados + link /admin)
```

O e-mail de convite sai **do app** (`/api/invites/issue`), não do n8n — assim o
link `/signup?token=` e a chave do SendGrid não transitam pelo n8n. O endpoint
**não** devolve o token na resposta (é credencial de acesso). Em falha de envio
ele responde 502, e aí o Slack traz nome/e-mail + link do painel de convites.

- **Webhook de produção:** `https://flowhook.chatjuridico.com/webhook/asaas/assinatura-claude-academy`
- **Endpoint chamado:** `POST https://claudeacademy.chatjuridico.com.br/api/invites/issue`

## Variáveis de ambiente (no n8n, não no Vercel)

O n8n é outro sistema — estas vão no **ambiente do n8n** (Settings → Variables,
ou `.env` da instância), não bastam no Vercel:

| Var | Uso |
|-----|-----|
| `ASAAS_WEBHOOK_TOKEN` | confere o header `asaas-access-token` que o Asaas envia |
| `ASAAS_API_KEY` | GET do cliente na API Asaas. Guarde **sem** o `$` inicial — o fluxo concatena o `$` na hora de usar (`access_token` = `=${{ $env.ASAAS_API_KEY }}`) |
| `INVITE_ISSUE_SECRET` | header `x-api-key` no POST do convite — **igual** ao do Vercel do app |

`INVITE_ISSUE_SECRET` precisa ser o **mesmo valor** aqui e no Vercel do app.

## Importar e configurar

1. No n8n: **Workflows → Import from File** → `asaas-convite-claude-academy.json`.
2. Defina as 3 variáveis acima no ambiente do n8n.
3. **Avisar no Slack** (HTTP Request): troque `COLE_AQUI_O_SLACK_INCOMING_WEBHOOK_URL`
   pelo Incoming Webhook do canal (pode ser o mesmo da waitlist).
4. No **Asaas** (Configurações → Integrações → Webhooks): aponte para o webhook
   de produção, marque o evento **PAYMENT_CONFIRMED** e use o token de acesso
   igual a `ASAAS_WEBHOOK_TOKEN`.
5. **Ative** o workflow.

> **Filtro de produto:** o IF exige a descrição do pagamento conter `Claude`.
> Se a conta Asaas vende só o Claude Academy — ou se as assinaturas não trazem
> "Claude" na descrição — remova a condição `cond-produto` do nó
> **Assinatura Claude confirmada?** para não perder assinantes.

## Testar

```bash
curl -X POST https://flowhook.chatjuridico.com/webhook/asaas/assinatura-claude-academy \
  -H 'Content-Type: application/json' \
  -H 'asaas-access-token: <ASAAS_WEBHOOK_TOKEN>' \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"customer":"cus_000xxxxx","description":"Assinatura Claude Academy"}}'
```

Espera-se `{"ok": true}`, o e-mail de convite na caixa do cliente e a mensagem
no Slack (✅ enviado, ou ⚠️ com os dados para gerar na mão).
