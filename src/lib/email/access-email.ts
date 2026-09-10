import { SITE_NAME, SITE_URL } from "@/lib/site";
import { sendEmail } from "./send";
import { escapeHtml, renderAcademyEmail } from "./layout";

function firstName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

function greeting(name?: string | null): string {
  const first = firstName(name);
  return first ? `Olá, ${first}!` : "Olá!";
}

export type AccessEmailInput = {
  to: string;
  magicLink: string;
  name?: string | null;
};

export function buildAccessEmail({
  magicLink,
  name,
}: Pick<AccessEmailInput, "magicLink" | "name">): {
  subject: string;
  html: string;
  text: string;
} {
  const loginUrl = new URL("/login", SITE_URL).toString();
  const hello = greeting(name);
  const subject = `Seu acesso ao ${SITE_NAME} está liberado`;

  const text = [
    hello,
    "",
    `Seu pagamento foi confirmado e o acesso ao ${SITE_NAME} já está liberado.`,
    "",
    "Entrar agora:",
    magicLink,
    "",
    `O link te leva direto pra área de membros. Se ele expirar, é só acessar ${loginUrl} com esse mesmo e-mail e pedir um link novo.`,
    "",
    "Bons estudos!",
    SITE_NAME,
  ].join("\n");

  const html = renderAcademyEmail({
    greeting: hello,
    paragraphs: [
      `Seu pagamento foi confirmado e o acesso ao ${SITE_NAME} já está liberado. É só clicar no botão abaixo pra entrar.`,
    ],
    cta: { href: magicLink, label: "Acessar o curso" },
    noteHtml: `O link te leva direto pra área de membros. Se ele expirar, acesse <a href="${escapeHtml(loginUrl)}" style="color:#d97757;text-decoration:none;">${escapeHtml(loginUrl)}</a> com esse mesmo e-mail e peça um link novo.`,
  });

  return { subject, html, text };
}

/**
 * E-mail de boas-vindas com o link de acesso (magic link) do Claude Academy.
 * Enviado após a confirmação de pagamento. O link cai direto na área de
 * membros; se expirar, o aluno pede outro em /login com o mesmo e-mail (a
 * conta já existe). O link é credencial de login, então só vai para o comprador.
 */
export async function sendAccessEmail({
  to,
  magicLink,
  name,
}: AccessEmailInput): Promise<void> {
  await sendEmail({ to, ...buildAccessEmail({ magicLink, name }) });
}
