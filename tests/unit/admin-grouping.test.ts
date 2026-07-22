import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLessonGroups } from "../../src/lib/lessons/admin-grouping.ts";
import type { LessonAdminRow } from "../../src/lib/lessons/types.ts";

function row(moduleId: string, lessonId: string, title = lessonId): LessonAdminRow {
  return {
    moduleId,
    moduleTitle: moduleId,
    lessonId,
    title,
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

describe("buildLessonGroups", () => {
  const lessons = [row("m1", "a"), row("m1", "b"), row("m2", "c")];

  it("fora do modo DB agrupa na ordem do backend", () => {
    const groups = buildLessonGroups(lessons, [], false);
    assert.equal(groups.length, 2);
    assert.deepEqual(
      groups.map((g) => g.lessons.map((l) => l.lessonId)),
      [["a", "b"], ["c"]],
    );
  });

  it("modo DB usa seções como espinha e inclui módulos vazios", () => {
    const sections = [
      { moduleId: "m1", title: "Módulo 1" },
      { moduleId: "m-empty", title: "Vazio" },
      { moduleId: "m2", title: "Módulo 2" },
    ];
    const groups = buildLessonGroups(lessons, sections, true);
    assert.deepEqual(groups.map((g) => g.moduleId), ["m1", "m-empty", "m2"]);
    assert.equal(groups[1].lessons.length, 0);
  });
});
