import { SITE_NAME } from "@/lib/site";
import { isEmailConfigured, sendEmail } from "./send";
import { escapeHtml, renderAcademyEmail } from "./layout";
import { buildInviteGreeting } from "@/lib/invites/recipient";
import type { InviteTitle } from "@/lib/invites/types";
import type { Product } from "@/lib/access/products";

/** Campos mínimos de um convite necessários para montar o e-mail. */
export type InviteEmailInput = {
  signupUrl: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientTitle: InviteTitle | null;
  /** Produto do convite; muda assunto e texto. Default: curso. */
  product?: Product;
};

export type SendInviteEmailResult = { ok: true } | { ok: false; error: string };

function greeting(name: string | null, title: InviteTitle | null): string {
  return buildInviteGreeting({ name, title }) ?? "Olá!";
}

const COPY: Record<Product, { subject: string; intro: string }> = {
  curso: {
    subject: `Seu convite para o ${SITE_NAME}`,
    intro: `Você foi convidado para o ${SITE_NAME}, o curso do Chat Jurídico sobre usar o Claude no dia a dia da advocacia.`,
  },
  degravacao: {
    subject: "Seu acesso ao Degravação com Claude",
    intro: `Seu acesso ao Degravação com Claude, no ${SITE_NAME}, está pronto. Lá estão o plugin, o passo a passo de instalação e as versões novas.`,
  },
};

/**
 * Monta o e-mail do convite (assunto, HTML e texto). Função pura — a saudação
 * concorda o gênero com o título quando existe (Dra./Dr.) e cai num "Olá!"
 * genérico sem nome. Mesmo envelope do e-mail de acesso.
 */
export function buildInviteEmail(invite: InviteEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const hello = greeting(invite.recipientName, invite.recipientTitle);
  const url = invite.signupUrl;
  const { subject, intro } = COPY[invite.product ?? "curso"];

  const text = [
    hello,
    "",
    intro,
    "",
    "Ative seu acesso por este link:",
    url,
    "",
    "Se você não reconhece este convite, é só ignorar este e-mail.",
    SITE_NAME,
  ].join("\n");

  const html = renderAcademyEmail({
    greeting: hello,
    paragraphs: [intro, "É rápido: clique no botão abaixo e crie seu acesso."],
    cta: { href: url, label: "Ativar meu acesso" },
    noteHtml: `Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${escapeHtml(url)}" style="color:#d97757;text-decoration:none;word-break:break-all;">${escapeHtml(url)}</a><br /><br />Se você não reconhece este convite, é só ignorar este e-mail.`,
  });

  return { subject, html, text };
}

/**
 * Envia o convite por e-mail via Resend. Retorna resultado estruturado em vez
 * de lançar: o convite pode ter sido criado mesmo assim, então quem chama
 * decide como avisar (UI mostra aviso + botão reenviar). Nunca loga o e-mail.
 */
export async function sendInviteEmail(
  invite: InviteEmailInput,
): Promise<SendInviteEmailResult> {
  const to = invite.recipientEmail?.trim();
  if (!to) {
    return { ok: false, error: "Convite sem e-mail do destinatário." };
  }
  if (!isEmailConfigured()) {
    return {
      ok: false,
      error: "Envio de e-mail indisponível (Resend não configurado).",
    };
  }

  try {
    await sendEmail({ to, ...buildInviteEmail(invite) });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail.",
    };
  }
}
