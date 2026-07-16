import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "../../scripts/security/audit-engine.mjs";

function readSrc(rel) {
  return readFileSync(join(PROJECT_ROOT, rel), "utf8");
}

/** Espelha src/lib/invites/recipient.ts (teste sem TS). */
function normalizeInviteTitle(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "") return null;
  if (normalized === "dr" || normalized === "dra") return normalized;
  throw new Error("Título inválido (use 'dr', 'dra' ou vazio).");
}

function buildInviteGreeting(recipient) {
  const name = recipient?.name?.trim();
  if (!name) return null;
  if (recipient?.title === "dra") return `Seja bem-vinda, Dra. ${name}`;
  if (recipient?.title === "dr") return `Seja bem-vindo, Dr. ${name}`;
  return `Seja bem-vindo(a), ${name}`;
}

describe("convite — saudação personalizada", () => {
  it("concorda o gênero com o título", () => {
    assert.equal(
      buildInviteGreeting({ name: "Fulana de Tal", title: "dra" }),
      "Seja bem-vinda, Dra. Fulana de Tal",
    );
    assert.equal(
      buildInviteGreeting({ name: "Fulano de Tal", title: "dr" }),
      "Seja bem-vindo, Dr. Fulano de Tal",
    );
  });

  it("sem título usa forma neutra; sem nome não saúda", () => {
    assert.equal(
      buildInviteGreeting({ name: "Alex", title: null }),
      "Seja bem-vindo(a), Alex",
    );
    assert.equal(buildInviteGreeting({ name: "", title: "dr" }), null);
    assert.equal(buildInviteGreeting({ name: null, title: null }), null);
    assert.equal(buildInviteGreeting(null), null);
  });

  it("normaliza título e rejeita valor inválido", () => {
    assert.equal(normalizeInviteTitle("DR "), "dr");
    assert.equal(normalizeInviteTitle(" Dra"), "dra");
    assert.equal(normalizeInviteTitle(""), null);
    assert.equal(normalizeInviteTitle(null), null);
    assert.throws(() => normalizeInviteTitle("doutor"), /inválido/i);
  });

  it("o link de convite carrega só o token (dados vêm do banco)", () => {
    const signupUrl = readSrc("src/lib/invites/signup-url.ts");
    assert.ok(signupUrl.includes('searchParams.set("token"'));
    assert.ok(!signupUrl.includes("recipient"));
    assert.ok(!signupUrl.includes("email"));
  });

  it("o /signup busca o convidado no banco e monta a saudação", () => {
    const page = readSrc("src/app/signup/page.tsx");
    assert.ok(page.includes("getInviteRecipientByToken"));
    assert.ok(page.includes("buildInviteGreeting"));
    assert.ok(page.includes("initialEmail"));
    // Só consulta com Supabase ativo (não quebra o modo demo).
    assert.ok(page.includes("isSupabaseEnabled"));
  });

  it("o lookup usa service role e casa o token exato (sem wildcard)", () => {
    const recipient = readSrc("src/lib/invites/recipient.ts");
    assert.ok(recipient.includes("createAdminClient"));
    assert.ok(recipient.includes('.eq("token"'));
    assert.ok(!recipient.includes(".ilike("));
  });
});
