import { test } from "node:test";
import assert from "node:assert/strict";
import { slugifyLessonTitle, uniqueLessonId } from "@/lib/lessons/slug";

test("slugify: minúsculo, sem acento, hífens", () => {
  assert.equal(slugifyLessonTitle("O que é o Claude"), "o-que-e-o-claude");
});

test("slugify: título vazio/só-símbolos cai no fallback 'aula'", () => {
  assert.equal(slugifyLessonTitle(""), "aula");
  assert.equal(slugifyLessonTitle("!!!"), "aula");
  assert.equal(slugifyLessonTitle("   "), "aula");
});

test("uniqueLessonId: colisão vira sufixo -2, -3", () => {
  const used = new Set(["intro", "intro-2"]);
  assert.equal(uniqueLessonId("intro", used), "intro-3");
  assert.equal(uniqueLessonId("novo", used), "novo");
});
