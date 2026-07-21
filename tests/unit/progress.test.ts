import { test } from "node:test";
import assert from "node:assert/strict";
import { findNextLesson } from "@/lib/course/progress";

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
