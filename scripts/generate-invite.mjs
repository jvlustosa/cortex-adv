/**
 * Cria convite de acesso na tabela invite_tokens.
 * Run: npm run invite -- --label "Turma março" --max-uses 5
 * Requer: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

loadEnvFile(".env.local");
loadEnvFile(".env");

function parseArgs(argv) {
  const options = {
    label: null,
    maxUses: 1,
    expiresAt: null,
    token: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--label" && next) {
      options.label = next;
      i++;
    } else if (arg === "--max-uses" && next) {
      options.maxUses = Number.parseInt(next, 10);
      i++;
    } else if (arg === "--expires" && next) {
      options.expiresAt = next;
      i++;
    } else if (arg === "--token" && next) {
      options.token = next;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function generateToken() {
  const year = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `CA-INV-${year}-${suffix}`;
}

function buildSignupUrl(siteUrl, token) {
  const url = new URL("/signup", siteUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Uso: npm run invite -- [opções]

Opções:
  --label "Turma março"   Rótulo interno (opcional)
  --max-uses 5            Usos permitidos (padrão: 1)
  --expires 2026-12-31    Data de expiração ISO (opcional)
  --token MEU-CODIGO      Token customizado (opcional)
`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!url || !key) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local",
    );
    process.exit(1);
  }

  if (!Number.isInteger(args.maxUses) || args.maxUses < 1) {
    console.error("--max-uses deve ser um inteiro >= 1");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let expiresAt = null;
  if (args.expiresAt) {
    const date = new Date(args.expiresAt);
    if (Number.isNaN(date.getTime())) {
      console.error("--expires inválido");
      process.exit(1);
    }
    expiresAt = date.toISOString();
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = args.token ?? generateToken();

    const { data, error } = await admin
      .from("invite_tokens")
      .insert({
        token,
        label: args.label,
        max_uses: args.maxUses,
        expires_at: expiresAt,
      })
      .select(
        "id, token, label, max_uses, used_count, expires_at, active, created_at",
      )
      .single();

    if (!error && data) {
      const signupUrl = buildSignupUrl(siteUrl, data.token);
      console.log("Convite criado:");
      console.log(`  Token:      ${data.token}`);
      console.log(`  Label:      ${data.label ?? "-"}`);
      console.log(`  Usos:       ${data.used_count}/${data.max_uses}`);
      console.log(`  Expira:     ${data.expires_at ?? "nunca"}`);
      console.log(`  Cadastro:   ${signupUrl}`);
      return;
    }

    if (args.token) {
      console.error(error?.message ?? "Falha ao criar convite.");
      process.exit(1);
    }

    const duplicate =
      error?.code === "23505" ||
      (error?.message ?? "").includes("duplicate key");
    if (!duplicate) {
      console.error(error?.message ?? "Falha ao criar convite.");
      process.exit(1);
    }
  }

  console.error("Não foi possível gerar token único.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
