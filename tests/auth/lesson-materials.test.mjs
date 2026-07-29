import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT } from "../../scripts/security/audit-engine.mjs";

const read = (rel) => readFileSync(join(PROJECT_ROOT, rel), "utf8");

describe("materiais por aula", () => {
  it("API de materiais exige sessão e trata params", () => {
    const route = read("src/app/api/lessons/materials/route.ts");
    assert.ok(route.includes("auth.getUser"), "deve checar sessão");
    assert.ok(route.includes("401"), "deve retornar 401 sem sessão");
    assert.ok(route.includes("moduleId") && route.includes("lessonId"));
  });

  it("lib de materiais degrada sem service role e usa signed URL", () => {
    const lib = read("src/lib/lessons/materials.ts");
    assert.ok(lib.includes("isServiceRoleConfigured"), "deve guardar por service role");
    assert.ok(lib.includes("createSignedUrl"), "download via signed URL");
    assert.ok(lib.includes("lesson_materials"));
  });

  it("player busca e exibe materiais com download", () => {
    const ui = read("src/components/members/course-area.tsx");
    assert.ok(ui.includes("/api/lessons/materials"));
    assert.ok(ui.includes("Materiais da aula"));
    assert.ok(ui.includes("download="));
  });

  it("arquivo sobe direto pro Storage, não pela API", () => {
    // A Vercel corta requisição acima de ~4,5 MB antes da função rodar. Se o
    // arquivo voltar a passar pela rota, PDF de aula quebra de novo em prod.
    const ticket = read(
      "src/app/api/admin/lessons/materials/upload-url/route.ts",
    );
    assert.ok(ticket.includes("createMaterialUploadTicket"));

    const route = read("src/app/api/admin/lessons/materials/route.ts");
    assert.ok(!route.includes("formData"), "rota não deve receber o arquivo");
    assert.ok(route.includes("registerLessonMaterial"), "só grava metadado");

    const lib = read("src/lib/lessons/materials.ts");
    assert.ok(lib.includes("createSignedUploadUrl"));
    // Sem conferir o objeto, upload interrompido vira card quebrado na aula.
    assert.ok(lib.includes("O arquivo não chegou no Storage"));
  });

  it("migration cria tabela e bucket privado", () => {
    const sql = read("supabase/migrations/010_lesson_materials.sql");
    assert.ok(sql.includes("create table if not exists public.lesson_materials"));
    assert.ok(sql.includes("storage.buckets"));
    assert.ok(sql.includes("enable row level security"));
  });
});
