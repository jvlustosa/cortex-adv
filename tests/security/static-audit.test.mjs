import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "fs";
import { join } from "path";
import {
  PROJECT_ROOT,
  runStaticAudit,
  walkSourceFiles,
  summarize,
  exitCodeFor,
  ADMIN_API_ROUTES,
  RLS_TABLES_EXPECTED,
} from "../../scripts/security/audit-engine.mjs";

describe("security audit — estático", () => {
  it("encontra arquivos fonte do projeto", () => {
    const files = walkSourceFiles(join(PROJECT_ROOT, "src"));
    assert.ok(files.length > 20, "esperado >20 arquivos em src/");
    assert.ok(files.some((f) => f.endsWith("middleware.ts") || f.includes("api/")));
  });

  it("todas as rotas admin existem no filesystem", () => {
    for (const route of ADMIN_API_ROUTES) {
      const file = join(PROJECT_ROOT, "src/app", `${route}/route.ts`);
      assert.ok(existsSync(file), `rota admin ausente: ${route}`);
    }
  });

  it("rotas admin usam assertAdminApi", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const unprotected = findings.filter((f) =>
      f.id.startsWith("admin-route-unprotected-"),
    );
    assert.equal(
      unprotected.length,
      0,
      `APIs admin sem proteção: ${unprotected.map((f) => f.id).join(", ")}`,
    );
  });

  it("service role não aparece em componentes client", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const exposed = findings.filter((f) => f.id === "service-role-client");
    assert.equal(exposed.length, 0, exposed.map((f) => f.detail).join("; "));
  });

  it("não flaga open redirect quando safeRedirectPath está em uso", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const openRedirect = findings.filter((f) =>
      f.id.startsWith("open-redirect-"),
    );
    assert.equal(
      openRedirect.length,
      0,
      `open redirect não mitigado: ${openRedirect.map((f) => f.id).join(", ")}`,
    );
  });

  it("signup de convite usa consumo atômico (sem race)", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const race = findings.find((f) => f.id === "signup-invite-race");
    assert.equal(
      race,
      undefined,
      "signup deve consumir o convite via RPC atômica consume_invite_token",
    );
  });

  it("conclusão de aula exige autenticação (sem brecha anônima)", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const anon = findings.find((f) => f.id === "lesson-complete-anonymous");
    assert.equal(
      anon,
      undefined,
      "POST /api/lessons/complete deve exigir sessão (getUser + 401)",
    );
  });

  it("detecta endpoints sem rate limit", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const expected = [
      "signup-no-rate-limit",
      "quiz-no-rate-limit",
      "lesson-complete-no-rate-limit",
      "certificate-no-rate-limit",
    ];
    for (const id of expected) {
      assert.ok(
        findings.some((f) => f.id === id),
        `deveria flagar ${id}`,
      );
    }
  });

  it("SQL habilita RLS nas tabelas sensíveis", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const rlsDisabled = findings.filter((f) => f.id.startsWith("rls-disabled-"));
    assert.equal(rlsDisabled.length, 0, rlsDisabled.map((f) => f.title).join("; "));

    const sqlPath = join(PROJECT_ROOT, "supabase/setup-completo.sql");
    assert.ok(existsSync(sqlPath));
    for (const table of RLS_TABLES_EXPECTED) {
      const missing = findings.find((f) => f.id === `rls-table-missing-${table}`);
      assert.equal(missing, undefined, `tabela ${table} ausente no SQL`);
    }
  });

  it("gera relatório com categorias de severidade", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const summary = summarize(findings);
    assert.ok(summary.total > 5, "auditoria deve produzir achados documentados");
    assert.equal(summary.critical, 0);
    assert.equal(summary.high, 0);
  });

  it("exit code 0 sem critical ou high", () => {
    const findings = runStaticAudit(PROJECT_ROOT);
    const code = exitCodeFor(findings);
    assert.equal(code, 0);
  });
});
