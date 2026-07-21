import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("progress — próxima aula e filtro de catálogo", () => {
  it("findNextLesson e getUserCourseProgress filtram contra o catálogo", () => {
    const progress = readFileSync(
      join(root, "src/lib/course/progress.ts"),
      "utf8",
    );
    assert.ok(progress.includes("export function findNextLesson"));
    assert.ok(progress.includes("catalogKeys.has(key)"));
    assert.ok(progress.includes("publishedKeys"));
  });
});

describe("certificado — emissão real", () => {
  it("issue.ts emite idempotente e página usa getOrIssueCertificate", () => {
    const issue = readFileSync(
      join(root, "src/lib/certificates/issue.ts"),
      "utf8",
    );
    const page = readFileSync(
      join(root, "src/app/certificado/page.tsx"),
      "utf8",
    );
    assert.ok(issue.includes("export async function getOrIssueCertificate"));
    assert.ok(issue.includes("getCertificateForUser"));
    assert.ok(issue.includes("CA-${year}-"));
    assert.ok(page.includes("getOrIssueCertificate"));
    assert.ok(!page.includes("code={null}"));
  });
});

describe("galeria — deep-link de skills", () => {
  it("lesson-ref carrega moduleId/lessonId e packs-area linka a aula", () => {
    const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
    const area = readFileSync(
      join(root, "src/components/members/packs-area.tsx"),
      "utf8",
    );
    assert.ok(packs.includes("export function lessonHref"));
    assert.ok(packs.includes('moduleId: "skills"'));
    assert.ok(area.includes("lessonHref(item)"));
    assert.ok(area.includes("Abrir aula e baixar nos materiais"));
  });
});

describe("catálogo — continuar assistindo", () => {
  it("LessonCardsGrid tem CTA Continuar e contador por módulo", () => {
    const grid = readFileSync(
      join(root, "src/components/aulas/lesson-cards-grid.tsx"),
      "utf8",
    );
    assert.ok(grid.includes("Continuar assistindo"));
    assert.ok(grid.includes("findNextLesson"));
    assert.ok(grid.includes("doneInModule"));
    assert.ok(grid.includes("Ver e baixar seu certificado"));
  });
});
