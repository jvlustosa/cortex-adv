/**
 * Gera os HTML de arquivo e dispara os dois transacionais via Resend.
 *
 *   npx tsx scripts/send-test-email.ts
 *   npx tsx scripts/send-test-email.ts --to outro@chatjuridico.com.br
 *
 * Sem --to, manda pra vitor@chatjuridico.com.br. Links são de preview
 * (não concedem acesso). From e logo usam o domínio de produção.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename: string) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");
process.env.NEXT_PUBLIC_SITE_URL =
  "https://claudeacademy.chatjuridico.com.br";

const toArg = process.argv.indexOf("--to");
const to =
  (toArg >= 0 ? process.argv[toArg + 1] : undefined) ??
  "vitor@chatjuridico.com.br";

const PREVIEW_SIGNUP =
  "https://claudeacademy.chatjuridico.com.br/signup?token=preview";
const PREVIEW_ACCESS = "https://claudeacademy.chatjuridico.com.br/login";

async function main() {
  const { isEmailConfigured, sendEmail } = await import(
    "../src/lib/email/send"
  );
  const { buildInviteEmail } = await import("../src/lib/email/invite-email");
  const { buildAccessEmail } = await import("../src/lib/email/access-email");

  if (!isEmailConfigured()) {
    console.error("RESEND_API_KEY ausente ou inválida no .env.local");
    process.exit(1);
  }

  const invite = buildInviteEmail({
    signupUrl: PREVIEW_SIGNUP,
    recipientName: "Vitor",
    recipientEmail: to,
    recipientTitle: "dr",
  });
  const access = buildAccessEmail({
    magicLink: PREVIEW_ACCESS,
    name: "Vitor Fontenele",
  });

  const outDir = resolve(root, "emails");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "convite.html"), invite.html, "utf8");
  writeFileSync(resolve(outDir, "acesso.html"), access.html, "utf8");
  console.log("Arquivos: emails/convite.html, emails/acesso.html");

  await sendEmail({
    to,
    subject: `[teste] ${invite.subject}`,
    html: invite.html,
    text: invite.text,
  });
  console.log("Enviado: convite");

  await sendEmail({
    to,
    subject: `[teste] ${access.subject}`,
    html: access.html,
    text: access.text,
  });
  console.log("Enviado: acesso");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
