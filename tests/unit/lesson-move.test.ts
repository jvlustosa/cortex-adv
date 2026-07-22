import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  adjacentModuleId,
  insertLessonAt,
  lessonIdsForModule,
  moveWithinModule,
} from "../../src/lib/lessons/admin-grouping.ts";
import type { LessonAdminRow } from "../../src/lib/lessons/types.ts";

function row(
  moduleId: string,
  lessonId: string,
  moduleTitle = moduleId,
): LessonAdminRow {
  return {
    moduleId,
    moduleTitle,
    lessonId,
    title: lessonId,
    duration: "",
    description: "",
    youtubeId: null,
    tella: null,
    published: true,
    viewCount: 0,
    feedbackCount: 0,
    avgRating: null,
    orderIndex: 0,
    origin: "custom",
  };
}

describe("lesson-move", () => {
  const base = [
    row("mod-a", "l1", "A"),
    row("mod-a", "l2", "A"),
    row("mod-b", "l3", "B"),
  ];

  it("moveWithinModule reordena dentro do módulo", () => {
    const next = moveWithinModule(base, "mod-a", "mod-a:l2", "mod-a:l1");
    assert.deepEqual(lessonIdsForModule(next, "mod-a"), ["l2", "l1"]);
    assert.deepEqual(lessonIdsForModule(next, "mod-b"), ["l3"]);
  });

  it("insertLessonAt move aula para outro módulo no fim", () => {
    const next = insertLessonAt(base, row("mod-a", "l1", "A"), "mod-b", null, "B");
    assert.deepEqual(lessonIdsForModule(next, "mod-a"), ["l2"]);
    assert.deepEqual(lessonIdsForModule(next, "mod-b"), ["l3", "l1"]);
  });

  it("insertLessonAt insere antes da aula alvo", () => {
    const next = insertLessonAt(
      base,
      row("mod-a", "l1", "A"),
      "mod-b",
      "mod-b:l3",
      "B",
    );
    assert.deepEqual(lessonIdsForModule(next, "mod-b"), ["l1", "l3"]);
  });

  it("adjacentModuleId retorna módulo vizinho", () => {
    assert.equal(adjacentModuleId(base, "mod-a", 1), "mod-b");
    assert.equal(adjacentModuleId(base, "mod-b", -1), "mod-a");
    assert.equal(adjacentModuleId(base, "mod-a", -1), null);
  });
});
