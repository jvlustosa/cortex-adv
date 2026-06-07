#!/usr/bin/env node
/**
 * Auditoria de segurança — Claude Academy
 *
 * Uso:
 *   npm run audit              # análise estática (código + SQL)
 *   npm run audit:live         # estática + probe HTTP (servidor rodando)
 *   npm run audit -- --json     # saída JSON
 *   AUDIT_BASE_URL=https://... npm run audit -- --live
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  PROJECT_ROOT,
  runStaticAudit,
  runLiveProbe,
  formatReport,
  summarize,
  exitCodeFor,
} from "./security/audit-engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const live = args.includes("--live");
const writeReport = args.includes("--write-report");
const baseUrl =
  process.env.AUDIT_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

async function main() {
  /** @type {import("./security/audit-engine.mjs").Finding[]} */
  let findings = runStaticAudit(PROJECT_ROOT);

  if (live) {
    console.error(`[audit] Probing ${baseUrl} …`);
    const liveFindings = await runLiveProbe(baseUrl);
    findings = [...findings, ...liveFindings];
    findings.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity] || a.id.localeCompare(b.id);
    });
  }

  const summary = summarize(findings);

  if (jsonOut) {
    console.log(JSON.stringify({ summary, findings, baseUrl: live ? baseUrl : null }, null, 2));
  } else {
    console.log(formatReport(findings));
    if (live) {
      console.log(`Live probe: ${baseUrl}`);
    }
  }

  if (writeReport) {
    const reportPath = resolve(PROJECT_ROOT, "security-audit-report.md");
    const md = buildMarkdownReport(findings, summary, live ? baseUrl : null);
    writeFileSync(reportPath, md, "utf8");
    console.error(`[audit] Relatório salvo em ${reportPath}`);
  }

  const code = exitCodeFor(findings);
  if (code !== 0) {
    console.error(
      `[audit] FALHOU — ${summary.critical} critical, ${summary.high} high (exit ${code})`,
    );
  } else {
    console.error(`[audit] OK — nenhum critical/high (exit 0)`);
  }

  process.exit(code);
}

/**
 * @param {import("./security/audit-engine.mjs").Finding[]} findings
 * @param {ReturnType<typeof summarize>} summary
 * @param {string | null} probeUrl
 */
function buildMarkdownReport(findings, summary, probeUrl) {
  const now = new Date().toISOString();
  const lines = [
    "# Security Audit — Claude Academy",
    "",
    `> Gerado em ${now}`,
    probeUrl ? `> Live probe: ${probeUrl}` : "> Modo: estático",
    "",
    "## Resumo",
    "",
    "| Severidade | Qtd |",
    "|------------|-----|",
    `| Critical | ${summary.critical} |`,
    `| High | ${summary.high} |`,
    `| Medium | ${summary.medium} |`,
    `| Low | ${summary.low} |`,
    `| Info | ${summary.info} |`,
    "",
    "## Achados",
    "",
  ];

  for (const f of findings) {
    lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`);
    lines.push("");
    lines.push(`- **ID:** \`${f.id}\``);
    lines.push(`- **Detalhe:** ${f.detail}`);
    if (f.file) lines.push(`- **Arquivo:** \`${f.file}\`${f.line ? ` (linha ${f.line})` : ""}`);
    if (f.remediation) lines.push(`- **Remediação:** ${f.remediation}`);
    lines.push("");
  }

  lines.push("## Checklist manual");
  lines.push("");
  lines.push("- [ ] `SUPABASE_SERVICE_ROLE_KEY` só na Vercel (nunca `NEXT_PUBLIC_*`)");
  lines.push("- [ ] Signup desligado em prod (`NEXT_PUBLIC_SIGNUP_ENABLED` não setado)");
  lines.push("- [ ] `admin_users` populado só com e-mails @chatjuridico.com.br");
  lines.push("- [ ] Redirect URLs do Supabase Auth restritas ao domínio");
  lines.push("- [ ] `INVITE_ADMIN_SECRET` forte e rotacionado");
  lines.push("");

  return lines.join("\n");
}

main().catch((err) => {
  console.error("[audit] Erro fatal:", err);
  process.exit(2);
});
