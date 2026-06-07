/**
 * Cadastra admins do painel /admin (admin_users + role em public.users).
 *
 * Uso:
 *   npm run admin:create              # lista padrão da equipe
 *   npm run admin:create -- --email outro@chatjuridico.com.br
 *   npm run admin:create -- --provision   # cria auth.users se não existir
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const ADMIN_EMAIL_DOMAINS = [
  "@chatjuridico.com.br",
  "@escritoriovilasboas.com",
];

/** Equipe padrão Claude Academy / Chat Jurídico */
const DEFAULT_ADMIN_EMAILS = [
  "vitor@chatjuridico.com.br",
  "marcelo@chatjuridico.com.br",
  "guilherme@chatjuridico.com.br",
  "otavio@chatjuridico.com.br",
  "marcos@escritoriovilasboas.com",
];

function loadEnvFile(filename) {
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

function parseArgs(argv) {
  const options = {
    emails: [],
    provision: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--email" && next) {
      options.emails.push(next.trim().toLowerCase());
      i++;
    } else if (arg === "--provision") {
      options.provision = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function hasAllowedDomain(email) {
  return ADMIN_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));
}

function tempPassword() {
  return `Ca-${randomBytes(9).toString("base64url")}!`;
}

async function findAuthUserByEmail(admin, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (match) return match;

    if (data.users.length < perPage) return null;
    page++;
  }
}

async function upsertAdminUser(db, email) {
  const { data, error } = await db
    .from("admin_users")
    .upsert({ email, active: true }, { onConflict: "email" })
    .select("id, email, active")
    .single();

  if (error) throw new Error(`admin_users: ${error.message}`);
  return data;
}

async function setPublicUserRoleAdmin(db, email) {
  const { data, error } = await db
    .from("users")
    .update({ role: "admin" })
    .eq("email", email)
    .select("id, email, role");

  if (error) throw new Error(`public.users: ${error.message}`);
  return data ?? [];
}

async function provisionAuthUser(admin, email) {
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    return { created: false, userId: existing.id };
  }

  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: email.split("@")[0] },
  });

  if (error) {
    throw new Error(`auth.createUser: ${error.message}`);
  }

  return { created: true, userId: data.user.id, password };
}

function printHelp() {
  console.log(`Uso: npm run admin:create -- [opções]

Cadastra e-mails em admin_users e define role=admin em public.users.

Opções:
  --email x@dominio     Adiciona e-mail (pode repetir). Sem flag, usa lista padrão.
  --provision           Cria auth.users com senha temporária se ainda não existir.
  -h, --help            Esta ajuda.

Padrão:
${DEFAULT_ADMIN_EMAILS.map((e) => `  - ${e}`).join("\n")}
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const emails =
    args.emails.length > 0 ? args.emails : [...DEFAULT_ADMIN_EMAILS];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local",
    );
    process.exit(1);
  }

  for (const email of emails) {
    if (!email.includes("@") || !hasAllowedDomain(email)) {
      console.error(
        `E-mail não permitido: ${email}\nDomínios: ${ADMIN_EMAIL_DOMAINS.join(", ")}`,
      );
      process.exit(1);
    }
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Cadastrando ${emails.length} admin(s)...\n`);

  for (const email of emails) {
    const row = await upsertAdminUser(admin, email);
    console.log(`✓ admin_users  ${row.email} (active=${row.active})`);

    if (args.provision) {
      const auth = await provisionAuthUser(admin, email);
      if (auth.created) {
        console.log(`  auth criado   user_id=${auth.userId}`);
        console.log(`  senha temp    ${auth.password}`);
        console.log("  → peça para trocar em /recuperar-senha ou login + alterar senha");
      } else {
        console.log(`  auth existente user_id=${auth.userId}`);
      }
    }

    const users = await setPublicUserRoleAdmin(admin, email);
    if (users.length > 0) {
      console.log(`  public.users  role=admin (${users.length} registro)`);
    } else {
      console.log(
        "  public.users  ainda sem linha (normal se auth ainda não existe; trigger cria no login)",
      );
    }

    console.log("");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log(`Painel: ${siteUrl}/admin`);
  console.log("Login:  " + `${siteUrl}/login`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
