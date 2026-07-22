import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lessonMoveBounds } from "../../src/lib/admin/lesson-move-bounds.ts";
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

describe("lessonMoveBounds", () => {
  const lessons = [row("a", "1"), row("a", "2"), row("b", "3")];

  it("meio do módulo pode subir e descer", () => {
    assert.deepEqual(lessonMoveBounds(lessons, row("a", "1"), false), {
      canMoveUp: false,
      canMoveDown: true,
    });
    assert.deepEqual(lessonMoveBounds(lessons, row("a", "2"), false), {
      canMoveUp: true,
      canMoveDown: false,
    });
  });

  it("modo DB libera mover entre módulos nas pontas", () => {
    assert.equal(lessonMoveBounds(lessons, row("a", "1"), true).canMoveUp, false);
    assert.equal(lessonMoveBounds(lessons, row("a", "2"), true).canMoveDown, true);
    assert.equal(lessonMoveBounds(lessons, row("b", "3"), true).canMoveUp, true);
  });
});
