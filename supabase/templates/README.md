# E-mails de autenticação (Supabase)

Templates HTML dos e-mails transacionais do Auth, no tema do site (escuro, terracota
`#d97757`, logo no header e no rodapé). O Supabase **não versiona** esses templates — eles
vivem no dashboard. Estes arquivos são a fonte de verdade; cole o conteúdo no dashboard.

## Onde aplicar

Dashboard → **Authentication → Emails → Templates** → cole cada arquivo no template
correspondente e clique em **Save changes**:

| Arquivo | Template no Supabase |
|---|---|
| `magic-link.html` | Magic link or OTP |
| `confirm-signup.html` | Confirm sign up |
| `invite.html` | Invite user |
| `change-email.html` | Change email address |
| `reset-password.html` | Reset password |
| `reauthentication.html` | Reauthentication |

## Regra de link (não quebrar)

- **Magic link / Confirm / Invite / Change email** usam o fluxo SSR `token_hash`:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<tipo>`. A rota
  [`/auth/confirm`](../../src/app/auth/confirm/route.ts) chama `verifyOtp` e grava a sessão em cookie.
- **Reset password** é a exceção: usa `{{ .ConfirmationURL }}` (fluxo `code` →
  [`/auth/callback`](../../src/app/auth/callback/route.ts), `exchangeCodeForSession`), que é como o
  app dispara o reset (`passwordResetRedirectUrl`). Não troque para `/auth/confirm`.

## URL Configuration (pré-requisito)

Authentication → URL Configuration:
- **Site URL:** `https://claudeacademy.chatjuridico.com.br`
- **Redirect URLs:** precisa conter `https://claudeacademy.chatjuridico.com.br/**` e
  `http://localhost:3000/**` (cobre `/auth/confirm` e `/auth/callback`).

## SMTP (produção)

O serviço de e-mail nativo do Supabase tem rate limit baixo (~2–4/h) e não é pra produção.
Antes de abrir pra turma, configurar SMTP próprio (Resend / SES / SendGrid) em SMTP Settings.

## Teste rápido

Peça um link novo e confira a URL no e-mail: tem que começar com
`https://claudeacademy.chatjuridico.com.br/auth/confirm?token_hash=`.
