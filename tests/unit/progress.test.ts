import { test } from "node:test";
import assert from "node:assert/strict";
import { findNextLesson, getUserCourseProgress } from "@/lib/course/progress";

// Força o estado "Supabase desligado" (prod misconfig / env ausente). Nesse
// modo getUserCourseProgress nunca deve tocar o DB nem quebrar — degrada em
// zeros. isSupabaseEnabled/isServiceRoleConfigured leem env em tempo de chamada,
// então setar aqui (após os imports) é suficiente e determinístico.
process.env.NODE_ENV = "test";
delete process.env.NEXT_PUBLIC_SUPABASE_ENABLED;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.COURSE_SOURCE;

// Catálogo mínimo no shape que findNextLesson consome (só id/title).
const course = {
  modules: [
    {
      id: "m1",
      title: "Módulo 1",
      lessons: [
        { id: "a", title: "Aula A" },
        { id: "b", title: "Aula B" },
      ],
    },
    {
      id: "m2",
      title: "Módulo 2",
      lessons: [{ id: "c", title: "Aula C" }],
    },
  ],
};

test("sem nada concluído: aponta pra primeira aula do catálogo", () => {
  const next = findNextLesson(course, []);
  assert.ok(next);
  assert.equal(next.moduleId, "m1");
  assert.equal(next.lessonId, "a");
  assert.equal(next.moduleTitle, "Módulo 1");
  assert.equal(next.lessonTitle, "Aula A");
  assert.equal(next.href, "/aulas/m1/a");
});

test("pula concluídas e respeita a ordem do catálogo", () => {
  const next = findNextLesson(course, ["m1:a"]);
  assert.equal(next?.lessonId, "b");

  const next2 = findNextLesson(course, ["m1:a", "m1:b"]);
  assert.equal(next2?.moduleId, "m2");
  assert.equal(next2?.lessonId, "c");
});

test("tudo concluído: retorna null (habilita o certificado, não trava)", () => {
  assert.equal(findNextLesson(course, ["m1:a", "m1:b", "m2:c"]), null);
});

test("chaves concluídas fora do catálogo (aula despublicada) são ignoradas", () => {
  const next = findNextLesson(course, ["m9:legado", "m1:a"]);
  assert.equal(next?.lessonId, "b");
});

test("curso vazio: null em vez de quebrar", () => {
  assert.equal(findNextLesson({ modules: [] }, []), null);
});

// --- Fallback: getUserCourseProgress com Supabase desligado ---------------
// Garante que a dashboard do aluno degrada (0%) em vez de estourar quando o
// Supabase está off/mal configurado em produção.

test("progresso: sem userId degrada pra zero sem quebrar", async () => {
  const p = await getUserCourseProgress(null);
  assert.equal(p.viewedLessons, 0);
  assert.equal(p.progressPercent, 0);
  assert.equal(p.isComplete, false);
  assert.deepEqual(p.completedKeys, []);
  assert.ok(Number.isInteger(p.totalLessons) && p.totalLessons >= 0);
});

test("progresso: com userId mas Supabase off ainda degrada (não toca o DB)", async () => {
  // Se a guarda falhasse, createAdminClient() lançaria — isto blindaria isso.
  const p = await getUserCourseProgress("user-123");
  assert.equal(p.viewedLessons, 0);
  assert.equal(p.progressPercent, 0);
  assert.equal(p.isComplete, false);
  assert.deepEqual(p.completedKeys, []);
});

test("smoke: catálogo estático carrega com aulas (totalLessons > 0)", async () => {
  const p = await getUserCourseProgress(null);
  assert.ok(p.totalLessons > 0, "catálogo estático do curso veio vazio");
});
