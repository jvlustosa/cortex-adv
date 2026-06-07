import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "../../scripts/security/audit-engine.mjs";

describe("modo demo — somente localhost", () => {
  it("isDemoMode existe e bloqueia produção", () => {
    const file = join(PROJECT_ROOT, "src/lib/supabase/enabled.ts");
    const content = readFileSync(file, "utf8");

    assert.ok(content.includes("export function isDemoMode()"));
    assert.ok(content.includes('process.env.NODE_ENV === "production") return false'));
    assert.ok(content.includes("isLocalhostSite()"));
  });

  it("requireCourseAccess usa isDemoMode antes de liberar acesso", () => {
    const file = join(PROJECT_ROOT, "src/lib/course/require-access.ts");
    const content = readFileSync(file, "utf8");

    assert.ok(content.includes("isDemoMode()"));
    assert.ok(!content.includes("authOn && !user"));
  });

  it("login e signup só mencionam modo demo com isDemoMode", () => {
    for (const rel of [
      "src/components/login-form.tsx",
      "src/components/signup-form.tsx",
    ]) {
      const content = readFileSync(join(PROJECT_ROOT, rel), "utf8");
      assert.ok(content.includes("isDemoMode()"), `${rel} deve usar isDemoMode()`);
      assert.ok(content.includes("modo demo"), `${rel} deve condicionar copy de demo`);
    }
  });
});
