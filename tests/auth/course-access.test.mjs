import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  BASE_URL,
  detectAuthMode,
  fetchApp,
  isServerReachable,
  locationPath,
} from "./helpers.mjs";

const LESSON_PATH = "/aulas/comece-aqui/o-que-e-claude";
const MEMBERS_PATH = "/area-de-membros";
const MEMBERS_PACKS_PATH = "/area-de-membros/packs";
const ADMIN_PATH = "/admin";

/** @type {import("./helpers.mjs").AuthMode} */
let authMode = "unknown";
let serverUp = false;

describe("auth — acesso ao curso", { skip: process.env.SKIP_AUTH_TESTS === "true" }, () => {
  before(async () => {
    serverUp = await isServerReachable();
    if (serverUp) {
      authMode = await detectAuthMode();
    }
  });

  it("servidor acessível", async (t) => {
    if (!serverUp) {
      return t.skip(`Servidor offline em ${BASE_URL}`);
    }
    assert.ok(serverUp);
  });

  it("página de login carrega", async (t) => {
    if (!serverUp) return t.skip("servidor offline");

    const res = await fetchApp("/login");
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Área de membros"));
  });

  it("modo demo: curso acessível sem login", async (t) => {
    if (!serverUp) return t.skip("servidor offline");
    if (authMode !== "demo") return t.skip("Supabase ativo — modo auth");

    for (const path of [MEMBERS_PATH, MEMBERS_PACKS_PATH, LESSON_PATH]) {
      const res = await fetchApp(path);
      assert.equal(res.status, 200, `${path} deve retornar 200 em demo`);
    }

    const loginHtml = await (await fetchApp("/login")).text();
    assert.ok(loginHtml.includes("Em breve"));
    assert.ok(loginHtml.includes("modo demo"));
  });

  it("modo auth: páginas do curso redirecionam para login", async (t) => {
    if (!serverUp) return t.skip("servidor offline");
    if (authMode !== "auth") return t.skip("Supabase desligado — modo demo");

    for (const path of [MEMBERS_PATH, MEMBERS_PACKS_PATH, LESSON_PATH]) {
      const res = await fetchApp(path);
      assert.ok(
        [307, 308, 302, 303].includes(res.status),
        `${path} deve redirecionar (got ${res.status})`,
      );
      const loc = locationPath(res) ?? "";
      assert.ok(loc.startsWith("/login"), `${path} → ${loc}`);
      assert.ok(loc.includes("next="), `${path} deve preservar next=`);
    }
  });

  it("modo auth: login exibe formulário", async (t) => {
    if (!serverUp) return t.skip("servidor offline");
    if (authMode !== "auth") return t.skip("modo demo");

    const html = await (await fetchApp("/login")).text();
    assert.ok(html.includes('type="email"') || html.includes("voce@escritorio"));
    assert.ok(!html.includes("Em breve"));
  });

  it("/admin redireciona visitante não autenticado", async (t) => {
    if (!serverUp) return t.skip("servidor offline");

    const res = await fetchApp(ADMIN_PATH);
    assert.ok([307, 308, 302, 303].includes(res.status), `status ${res.status}`);
    const loc = locationPath(res) ?? "";
    assert.ok(loc.startsWith("/login"), `admin → ${loc}`);
    assert.ok(loc.includes("next=%2Fadmin") || loc.includes("next=/admin"));
  });

  it("API de feedback exige sessão", async (t) => {
    if (!serverUp) return t.skip("servidor offline");
    if (authMode === "demo") return t.skip("feedback API off em demo");

    const res = await fetchApp("/api/lessons/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        moduleId: "cowork",
        lessonId: "cowork-1",
        rating: 5,
      }),
    });

    assert.notEqual(res.status, 200);
    assert.ok([401, 403, 503].includes(res.status), `status ${res.status}`);
  });

  it("signup rejeita payload inválido", async (t) => {
    if (!serverUp) return t.skip("servidor offline");

    const res = await fetchApp("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "x@test.com", password: "short" }),
    });

    assert.notEqual(res.status, 200);
    assert.ok([400, 403, 503].includes(res.status));
  });

  it("login com next preserva destino na URL", async (t) => {
    if (!serverUp) return t.skip("servidor offline");

    const res = await fetchApp(`/login?next=${encodeURIComponent(LESSON_PATH)}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Área de membros"));
  });
});
