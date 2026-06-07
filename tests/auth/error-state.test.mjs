import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "../../scripts/security/audit-engine.mjs";

function readSrc(rel) {
  return readFileSync(join(PROJECT_ROOT, rel), "utf8");
}

describe("estado de erro global", () => {
  it("error.tsx e global-error.tsx existem", () => {
    assert.ok(readSrc("src/app/error.tsx").includes("ErrorState"));
    assert.ok(readSrc("src/app/global-error.tsx").includes("ErrorState"));
  });

  it("ErrorState usa grid, ícone laranja e suporte", () => {
    const component = readSrc("src/components/error-state.tsx");
    const css = readSrc("src/components/error-state.module.css");

    assert.ok(component.includes("AlertTriangle"));
    assert.ok(component.includes("buildErrorSupportWhatsAppUrl"));
    assert.ok(component.includes("COURSE_SUPPORT_PHONE_DISPLAY"));
    assert.ok(component.includes('role="alert"'));
    assert.ok(css.includes(".grid"));
    assert.ok(css.includes("#fb923c"));
  });

  it("mensagens de API em inglês são mapeadas para português", async () => {
    const { readApiErrorMessage } = await import(
      "../../src/lib/errors/format.ts"
    ).catch(() => ({ readApiErrorMessage: null }));

    if (!readApiErrorMessage) {
      const format = readSrc("src/lib/errors/format.ts");
      assert.ok(format.includes("mapEnglishApiError"));
      assert.ok(format.includes("Muitas tentativas"));
      return;
    }

    const res = new Response(
      JSON.stringify({ error: "Too many requests" }),
      { status: 429 },
    );
    const msg = await readApiErrorMessage(res);
    assert.match(msg, /muitas tentativas/i);
  });

  it("APIs públicas não expõem mensagens em inglês", () => {
    const waitlist = readSrc("src/app/api/waitlist/route.ts");
    const quiz = readSrc("src/app/api/quiz/route.ts");

    assert.ok(!waitlist.includes('"Too many requests"'));
    assert.ok(!waitlist.includes('"Slack error"'));
    assert.ok(!waitlist.includes('"Network error"'));
    assert.ok(!quiz.includes("Webhook not configured"));
  });
});
