/**
 * Motor de auditoria de segurança — Claude Academy
 * Varre código-fonte, SQL e (opcional) endpoints ao vivo.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(__dirname, "../..");

/** @typedef {"critical" | "high" | "medium" | "low" | "info"} Severity */

/**
 * @typedef {object} Finding
 * @property {string} id
 * @property {Severity} severity
 * @property {string} title
 * @property {string} detail
 * @property {string} [file]
 * @property {number} [line]
 * @property {string} [remediation]
 */

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const SECRET_PATTERNS = [
  { id: "hardcoded-jwt", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: "hardcoded-aws-key", re: /AKIA[0-9A-Z]{16}/ },
  { id: "hardcoded-private-key", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  {
    id: "hardcoded-service-role",
    re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']eyJ[^"']+["']/,
  },
  {
    id: "hardcoded-slack-webhook",
    re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/,
  },
];

const CLIENT_PATH_HINTS = [
  "use client",
  "components/",
  "app/",
  "lib/supabase/client",
];

const ADMIN_API_ROUTES = [
  "/api/admin/members",
  "/api/admin/invites",
  "/api/admin/lessons",
  "/api/admin/feedback",
];

const PUBLIC_API_ROUTES = [
  { path: "/api/auth/signup", methods: ["POST"], note: "Cadastro com convite" },
  { path: "/api/certificados/CA-2026-0000", methods: ["GET"], note: "Validação pública" },
  { path: "/api/lessons/feedback", methods: ["POST"], note: "Feedback autenticado" },
  { path: "/api/lessons/view", methods: ["POST"], note: "View sem auth obrigatória" },
  { path: "/api/quiz", methods: ["POST"], note: "Webhook Slack" },
  { path: "/api/waitlist", methods: ["POST"], note: "Lista de espera" },
];

const RLS_TABLES_EXPECTED = [
  "invite_tokens",
  "certificates",
  "lesson_overrides",
  "lesson_views",
  "lesson_feedback",
  "admin_users",
];

/**
 * @param {string} dir
 * @param {string[]} [acc]
 * @returns {string[]}
 */
export function walkSourceFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", ".git", "public"].includes(entry)) continue;
      walkSourceFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs|sql|env\.example)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

/**
 * @param {string} content
 * @param {RegExp} pattern
 * @returns {number | undefined}
 */
function firstLine(content, pattern) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return undefined;
}

/**
 * @param {Finding[]} findings
 * @returns {Finding[]}
 */
export function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) return sev;
    return a.id.localeCompare(b.id);
  });
}

/**
 * @param {string} [root]
 * @returns {Finding[]}
 */
export function runStaticAudit(root = PROJECT_ROOT) {
  /** @type {Finding[]} */
  const findings = [];
  const srcDir = join(root, "src");
  const files = walkSourceFiles(srcDir).concat(
    existsSync(join(root, "middleware.ts")) ? [join(root, "middleware.ts")] : [],
    existsSync(join(root, "supabase/setup-completo.sql"))
      ? [join(root, "supabase/setup-completo.sql")]
      : [],
  );

  const fileContents = new Map(
    files.map((f) => [f, readText(f)]),
  );

  // ── Secrets em código ─────────────────────────────────────────────────────
  for (const [file, content] of fileContents) {
    const rel = relative(root, file);
    if (rel.endsWith(".env") || rel.includes(".env.local")) continue;

    for (const { id, re } of SECRET_PATTERNS) {
      if (re.test(content)) {
        findings.push({
          id: `secret-${id}`,
          severity: "critical",
          title: "Possível segredo hardcoded",
          detail: `Padrão ${id} encontrado em ${rel}`,
          file: rel,
          line: firstLine(content, re),
          remediation: "Mover para variável de ambiente e rotacionar o segredo.",
        });
      }
    }
  }

  // ── service_role no client ────────────────────────────────────────────────
  for (const [file, content] of fileContents) {
    const rel = relative(root, file);
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(rel)) continue;
    if (!content.includes("SUPABASE_SERVICE_ROLE_KEY") && !content.includes("createAdminClient")) {
      continue;
    }

    const isClient =
      content.includes('"use client"') ||
      content.includes("'use client'") ||
      rel.includes("lib/supabase/client");

    if (isClient && content.includes("SERVICE_ROLE")) {
      findings.push({
        id: "service-role-client",
        severity: "critical",
        title: "Service role exposto no client",
        detail: `${rel} referencia SUPABASE_SERVICE_ROLE_KEY em código client-side.`,
        file: rel,
        remediation: "Usar apenas anon key no browser; service role só em API/server.",
      });
    }
  }

  // ── Open redirect ─────────────────────────────────────────────────────────
  const callbackFile = join(root, "src/app/auth/callback/route.ts");
  if (existsSync(callbackFile)) {
    const content = readText(callbackFile);
    if (
      content.includes('searchParams.get("next")') &&
      !content.includes("safeRedirectPath")
    ) {
      findings.push({
        id: "open-redirect-auth-callback",
        severity: "high",
        title: "Open redirect no callback OAuth",
        detail:
          "Parâmetro `next` em /auth/callback é concatenado ao origin sem validação de path relativo.",
        file: "src/app/auth/callback/route.ts",
        remediation: "Usar safeRedirectPath() para validar destinos internos.",
      });
    }
  }

  const loginForm = join(root, "src/components/login-form.tsx");
  if (existsSync(loginForm)) {
    const content = readText(loginForm);
    if (content.includes("router.push(next)") && !content.includes("safeRedirectPath")) {
      findings.push({
        id: "open-redirect-login",
        severity: "high",
        title: "Open redirect pós-login",
        detail: "LoginForm faz router.push(next) sem validar que next é path interno.",
        file: "src/components/login-form.tsx",
        remediation: "Usar safeRedirectPath() no parâmetro next.",
      });
    }
  }

  const recoveryPage = join(root, "src/app/recuperar-senha/page.tsx");
  if (!existsSync(recoveryPage)) {
    findings.push({
      id: "password-recovery-missing",
      severity: "medium",
      title: "Fluxo de recuperação de senha ausente",
      detail: "Página /recuperar-senha não encontrada.",
      remediation: "Implementar resetPasswordForEmail + /auth/atualizar-senha.",
    });
  }

  // ── Middleware não protege rotas sensíveis ────────────────────────────────
  const middlewareFile = join(root, "middleware.ts");
  if (existsSync(middlewareFile)) {
    const content = readText(middlewareFile);
    if (!content.includes("/admin") && !content.includes("/aulas")) {
      findings.push({
        id: "middleware-no-route-guard",
        severity: "medium",
        title: "Middleware só renova sessão",
        detail:
          "middleware.ts não bloqueia /admin ou /aulas; proteção depende de checks em cada page/API.",
        file: "middleware.ts",
        remediation:
          "Aceitável se todas as pages/APIs chamam requireAdmin/requireCourseAccess. Auditar cobertura.",
      });
    }
  }

  // ── Inventário de APIs admin ──────────────────────────────────────────────
  for (const routePath of ADMIN_API_ROUTES) {
    const file = join(root, "src/app", `${routePath}/route.ts`);
    if (!existsSync(file)) {
      findings.push({
        id: `admin-route-missing-${routePath}`,
        severity: "high",
        title: "Rota admin esperada ausente",
        detail: `Arquivo não encontrado: src/app${routePath}/route.ts`,
        remediation: "Verificar se a rota foi movida ou removida.",
      });
      continue;
    }
    const content = readText(file);
    if (!content.includes("assertAdminApi")) {
      findings.push({
        id: `admin-route-unprotected-${routePath}`,
        severity: "critical",
        title: "API admin sem assertAdminApi",
        detail: `${routePath} não chama assertAdminApi().`,
        file: relative(root, file),
        remediation: "Adicionar assertAdminApi() no início de cada handler.",
      });
    }
  }

  // ── Endpoints sem rate limit ──────────────────────────────────────────────
  const noRateLimitRoutes = [
    {
      file: "src/app/api/auth/signup/route.ts",
      id: "signup-no-rate-limit",
      title: "Signup sem rate limit",
    },
    {
      file: "src/app/api/quiz/route.ts",
      id: "quiz-no-rate-limit",
      title: "Quiz webhook sem rate limit",
    },
    {
      file: "src/app/api/lessons/view/route.ts",
      id: "lesson-view-no-rate-limit",
      title: "Lesson view sem rate limit",
    },
    {
      file: "src/app/api/certificados/[code]/route.ts",
      id: "certificate-no-rate-limit",
      title: "Validação de certificado sem rate limit",
    },
  ];

  for (const route of noRateLimitRoutes) {
    const full = join(root, route.file);
    if (!existsSync(full)) continue;
    const content = readText(full);
    if (!content.includes("rateLimit") && !content.includes("RateLimit")) {
      findings.push({
        id: route.id,
        severity: "medium",
        title: route.title,
        detail: `${route.file} aceita POST/GET sem throttling por IP.`,
        file: route.file,
        remediation: "Adicionar rate limit in-memory ou via Vercel/Upstash.",
      });
    }
  }

  // ── Lesson view sem auth ──────────────────────────────────────────────────
  const viewRoute = join(root, "src/app/api/lessons/view/route.ts");
  if (existsSync(viewRoute)) {
    const content = readText(viewRoute);
    if (content.includes("user?.id ?? null")) {
      findings.push({
        id: "lesson-view-anonymous",
        severity: "medium",
        title: "Views de aula aceitas sem login",
        detail: "POST /api/lessons/view grava views com user_id null para anônimos.",
        file: "src/app/api/lessons/view/route.ts",
        remediation: "Exigir auth ou rate limit agressivo para evitar inflação de métricas.",
      });
    }
  }

  // ── Race condition no signup ──────────────────────────────────────────────
  const signupRoute = join(root, "src/app/api/auth/signup/route.ts");
  if (existsSync(signupRoute)) {
    const content = readText(signupRoute);
    if (
      content.includes("used_count + 1") &&
      !content.includes("consume_invite_token")
    ) {
      findings.push({
        id: "signup-invite-race",
        severity: "medium",
        title: "Race condition no consumo de convite",
        detail:
          "Signup incrementa used_count após createUser, sem transação atômica (RPC consume_invite_token existe mas não é usada).",
        file: "src/app/api/auth/signup/route.ts",
        remediation: "Usar consume_invite_token() ou update condicional com used_count < max_uses.",
      });
    }
  }

  // ── Quiz sem validação de input ───────────────────────────────────────────
  const quizRoute = join(root, "src/app/api/quiz/route.ts");
  if (existsSync(quizRoute)) {
    const content = readText(quizRoute);
    if (!content.includes("assertAdmin") && !content.includes("getUser")) {
      findings.push({
        id: "quiz-unauthenticated",
        severity: "medium",
        title: "Quiz webhook público",
        detail: "POST /api/quiz aceita payload arbitrário e encaminha ao Slack sem auth.",
        file: "src/app/api/quiz/route.ts",
        remediation: "Rate limit + validação de schema + sanitização do texto enviado ao Slack.",
      });
    }
  }

  // ── RLS no SQL ────────────────────────────────────────────────────────────
  const sqlFile = join(root, "supabase/setup-completo.sql");
  if (existsSync(sqlFile)) {
    const sql = readText(sqlFile);
    for (const table of RLS_TABLES_EXPECTED) {
      if (!sql.includes(`public.${table}`)) {
        findings.push({
          id: `rls-table-missing-${table}`,
          severity: "high",
          title: `Tabela ${table} ausente no setup SQL`,
          detail: `setup-completo.sql não referencia public.${table}.`,
          file: "supabase/setup-completo.sql",
        });
        continue;
      }
      if (!sql.includes(`alter table public.${table} enable row level security`)) {
        findings.push({
          id: `rls-disabled-${table}`,
          severity: "critical",
          title: `RLS desabilitado em ${table}`,
          detail: `Tabela public.${table} sem ENABLE ROW LEVEL SECURITY.`,
          file: "supabase/setup-completo.sql",
          remediation: "Habilitar RLS e definir policies mínimas ou bloquear anon.",
        });
      }
    }

    if (!sql.includes("verify_certificate")) {
      findings.push({
        id: "rpc-verify-certificate-missing",
        severity: "high",
        title: "RPC verify_certificate ausente",
        detail: "Função pública de verificação de certificado não encontrada no SQL.",
        file: "supabase/setup-completo.sql",
      });
    }

    const tablesWithoutPolicies = ["lesson_overrides", "lesson_views", "lesson_feedback"];
    for (const table of tablesWithoutPolicies) {
      if (!sql.includes(`create policy`) || !sql.includes(table)) {
        findings.push({
          id: `rls-no-policy-${table}`,
          severity: "low",
          title: `RLS sem policy explícita: ${table}`,
          detail:
            `${table} tem RLS ON mas sem CREATE POLICY — anon/authenticated bloqueados por padrão; service role bypassa.`,
          file: "supabase/setup-completo.sql",
          remediation:
            "Documentar que acesso é só via service role nas APIs. Opcional: policies read-only para authenticated.",
        });
      }
    }
  }

  // ── Certificado: enumeração ────────────────────────────────────────────────
  findings.push({
    id: "certificate-enumeration",
    severity: "low",
    title: "Certificados sujeitos a enumeração",
    detail:
      "Formato CA-YYYY-NNNN previsível; API /api/certificados/[code] e RPC verify_certificate permitem brute-force.",
    remediation: "Rate limit + código com entropia maior ou CAPTCHA após N tentativas.",
  });

  // ── Demo mode em produção ─────────────────────────────────────────────────
  const enabledFile = join(root, "src/lib/supabase/enabled.ts");
  if (existsSync(enabledFile)) {
    const content = readText(enabledFile);
    if (!content.includes("isDemoMode")) {
      findings.push({
        id: "demo-mode-not-gated",
        severity: "high",
        title: "Modo demo sem restrição a localhost",
        detail: "isDemoMode() ausente — curso pode ficar aberto fora de localhost.",
        file: "src/lib/supabase/enabled.ts",
        remediation: "Implementar isDemoMode() com isLocalhostSite() + production guard.",
      });
    }
  }

  // ── Env vars sensíveis documentadas ───────────────────────────────────────
  const requiredSecrets = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SLACK_QUIZ_WEBHOOK_URL",
  ];
  for (const key of requiredSecrets) {
    const usedInSrc = [...fileContents.entries()].some(([, c]) => c.includes(key));
    if (usedInSrc) {
      findings.push({
        id: `env-${key.toLowerCase()}`,
        severity: "info",
        title: `Variável sensível: ${key}`,
        detail: `Confirmar que ${key} está só na Vercel/.env.local e nunca no client bundle.`,
      });
    }
  }

  return sortFindings(findings);
}

/**
 * @param {string} baseUrl
 * @returns {Promise<Finding[]>}
 */
export async function runLiveProbe(baseUrl) {
  /** @type {Finding[]} */
  const findings = [];
  const base = baseUrl.replace(/\/$/, "");

  async function probe(method, path, options = {}) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          ...(options.headers ?? {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        redirect: "manual",
      });
      return { status: res.status, headers: res.headers, url };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), url };
    }
  }

  // Admin APIs devem retornar 401/503 sem sessão
  for (const path of ADMIN_API_ROUTES) {
    const result = await probe("GET", path);
    if ("error" in result) {
      findings.push({
        id: `live-admin-unreachable-${path}`,
        severity: "info",
        title: `Probe falhou: ${path}`,
        detail: result.error,
      });
      continue;
    }
    if (result.status === 200) {
      findings.push({
        id: `live-admin-exposed-${path}`,
        severity: "critical",
        title: `API admin exposta: ${path}`,
        detail: `GET ${path} retornou 200 sem autenticação.`,
        remediation: "Verificar assertAdminApi e cookies de sessão.",
      });
    } else if (![401, 403, 503].includes(result.status)) {
      findings.push({
        id: `live-admin-unexpected-${path}`,
        severity: "medium",
        title: `Status inesperado em ${path}`,
        detail: `GET ${path} → HTTP ${result.status} (esperado 401/503).`,
      });
    }
  }

  // Signup sem corpo
  const signup = await probe("POST", "/api/auth/signup", { body: {} });
  if (!("error" in signup) && signup.status === 200) {
    findings.push({
      id: "live-signup-open",
      severity: "critical",
      title: "Signup aceita payload vazio",
      detail: "POST /api/auth/signup retornou 200 sem email/senha/token.",
    });
  }

  // Certificado formato inválido
  const cert = await probe("GET", "/api/certificados/INVALID");
  if (!("error" in cert) && cert.status === 200) {
    findings.push({
      id: "live-cert-invalid-200",
      severity: "medium",
      title: "Certificado inválido retorna 200",
      detail: "GET /api/certificados/INVALID deveria retornar 400/404.",
    });
  }

  // Open redirect no callback (sem code válido — só checa se aceita next externo na URL)
  const redirectProbe = await probe(
    "GET",
    "/auth/callback?next=//evil.example&code=fake",
  );
  if (!("error" in redirectProbe)) {
    const location = redirectProbe.headers.get("location") ?? "";
    if (location.includes("evil.example")) {
      findings.push({
        id: "live-open-redirect-callback",
        severity: "high",
        title: "Open redirect confirmado no callback",
        detail: `Location: ${location}`,
        remediation: "Sanitizar parâmetro next antes do redirect.",
      });
    }
  }

  // Lesson view anônimo
  const view = await probe("POST", "/api/lessons/view", {
    body: { moduleId: "mod-1", lessonId: "aula-1" },
  });
  if (!("error" in view) && view.status === 200) {
    findings.push({
      id: "live-lesson-view-anonymous-ok",
      severity: "info",
      title: "Lesson view aceita anônimo (confirmado ao vivo)",
      detail: "POST /api/lessons/view retornou 200 sem cookie de sessão.",
    });
  }

  // Feedback sem auth deve ser 401
  const feedback = await probe("POST", "/api/lessons/feedback", {
    body: { moduleId: "m", lessonId: "l", rating: 5 },
  });
  if (!("error" in feedback) && feedback.status === 200) {
    findings.push({
      id: "live-feedback-unauthenticated",
      severity: "critical",
      title: "Feedback sem autenticação",
      detail: "POST /api/lessons/feedback retornou 200 sem sessão.",
    });
  }

  return sortFindings(findings);
}

/**
 * @param {Finding[]} findings
 * @returns {{ critical: number, high: number, medium: number, low: number, info: number, total: number }}
 */
export function summarize(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: findings.length };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

/**
 * @param {Finding[]} findings
 * @returns {string}
 */
export function formatReport(findings, { title = "Claude Academy · Security Audit" } = {}) {
  const summary = summarize(findings);
  const lines = [
    "",
    "═".repeat(72),
    title,
    "═".repeat(72),
    `Total: ${summary.total}  |  CRITICAL: ${summary.critical}  HIGH: ${summary.high}  MEDIUM: ${summary.medium}  LOW: ${summary.low}  INFO: ${summary.info}`,
    "",
  ];

  let lastSeverity = "";
  for (const f of findings) {
    if (f.severity !== lastSeverity) {
      lines.push(`── ${f.severity.toUpperCase()} ${"─".repeat(64 - f.severity.length)}`);
      lastSeverity = f.severity;
    }
    lines.push(`[${f.id}] ${f.title}`);
    lines.push(`  ${f.detail}`);
    if (f.file) lines.push(`  📁 ${f.file}${f.line ? `:${f.line}` : ""}`);
    if (f.remediation) lines.push(`  → ${f.remediation}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * @param {Finding[]} findings
 * @param {{ failOn?: Severity[] }} [opts]
 * @returns {number} exit code
 */
export function exitCodeFor(findings, opts = {}) {
  const failOn = opts.failOn ?? ["critical", "high"];
  return findings.some((f) => failOn.includes(f.severity)) ? 1 : 0;
}

export { ADMIN_API_ROUTES, PUBLIC_API_ROUTES, RLS_TABLES_EXPECTED };
