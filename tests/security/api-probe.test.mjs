import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  runLiveProbe,
  ADMIN_API_ROUTES,
} from "../../scripts/security/audit-engine.mjs";

const BASE_URL =
  process.env.AUDIT_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

/** @type {boolean} */
let serverUp = false;

async function isServerReachable() {
  try {
    const res = await fetch(BASE_URL, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

describe("security audit — probe HTTP", { skip: process.env.SKIP_LIVE_PROBE === "true" }, () => {
  before(async () => {
    serverUp = await isServerReachable();
  });

  it("servidor acessível para probe ao vivo", async (t) => {
    if (!serverUp) {
      t.skip(`Servidor offline em ${BASE_URL} — suba com npm run dev ou defina AUDIT_BASE_URL`);
    }
    assert.ok(serverUp);
  });

  it("APIs admin não retornam 200 sem sessão", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    const findings = await runLiveProbe(BASE_URL);
    const exposed = findings.filter((f) => f.id.startsWith("live-admin-exposed-"));
    assert.equal(
      exposed.length,
      0,
      `Admin exposto: ${exposed.map((f) => f.detail).join("; ")}`,
    );
  });

  it("POST /api/invites rejeita sem secret", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    const res = await fetch(`${BASE_URL}/api/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "probe-test" }),
    });
    assert.notEqual(res.status, 200, "criar convite sem secret não deve retornar 200");
    assert.ok([401, 403, 503].includes(res.status), `status inesperado: ${res.status}`);
  });

  it("POST /api/lessons/feedback exige autenticação", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    const res = await fetch(`${BASE_URL}/api/lessons/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moduleId: "m1", lessonId: "l1", rating: 5 }),
    });
    assert.notEqual(res.status, 200);
    assert.ok([401, 403, 503].includes(res.status));
  });

  it("GET /api/certificados/INVALID rejeita formato", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    const res = await fetch(`${BASE_URL}/api/certificados/INVALID`);
    assert.ok([400, 404, 503].includes(res.status), `status: ${res.status}`);
  });

  it("POST /api/auth/signup rejeita payload vazio", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.notEqual(res.status, 200);
    assert.ok([400, 403, 503].includes(res.status));
  });

  it("inventário admin coberto pelo probe", async (t) => {
    if (!serverUp) t.skip("servidor offline");

    for (const path of ADMIN_API_ROUTES) {
      const res = await fetch(`${BASE_URL}${path}`);
      assert.notEqual(
        res.status,
        200,
        `${path} não deve retornar 200 sem auth (got ${res.status})`,
      );
    }
  });
});
