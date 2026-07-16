import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeCourseWithOverrides } from "@/lib/lessons/merge-course";

const course = {
  title: "T",
  subtitle: "S",
  modules: [
    {
      id: "m1",
      title: "M1",
      description: "",
      thumbnailGradient: "",
      lessons: [
        { id: "a", title: "A", duration: "1", description: "" },
        { id: "b", title: "B", duration: "1", description: "" },
      ],
    },
    {
      id: "m2",
      title: "M2",
      description: "",
      thumbnailGradient: "",
      lessons: [{ id: "c", title: "C", duration: "1", description: "" }],
    },
  ],
};

test("inclui aula custom publicada no módulo", () => {
  const overrides = [
    {
      module_id: "m1",
      lesson_id: "nova",
      title: "Nova",
      duration: null,
      description: null,
      youtube_id: null,
      tella: "x",
      published: true,
      order_index: 5,
      updated_at: "",
    },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  const m1 = merged.modules.find((m) => m.id === "m1")!;
  assert.deepEqual(
    m1.lessons.map((l) => l.id),
    ["a", "b", "nova"],
  );
});

test("reorder via order_index", () => {
  const overrides = [
    {
      module_id: "m1",
      lesson_id: "a",
      order_index: 1,
      published: true,
      title: null,
      duration: null,
      description: null,
      youtube_id: null,
      tella: null,
      updated_at: "",
    },
    {
      module_id: "m1",
      lesson_id: "b",
      order_index: 0,
      published: true,
      title: null,
      duration: null,
      description: null,
      youtube_id: null,
      tella: null,
      updated_at: "",
    },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  assert.deepEqual(
    merged.modules.find((m) => m.id === "m1")!.lessons.map((l) => l.id),
    ["b", "a"],
  );
});

test("módulo sem aulas publicadas é dropado", () => {
  const overrides = [
    {
      module_id: "m2",
      lesson_id: "c",
      published: false,
      order_index: null,
      title: null,
      duration: null,
      description: null,
      youtube_id: null,
      tella: null,
      updated_at: "",
    },
  ];
  const merged = mergeCourseWithOverrides(course, overrides);
  assert.equal(
    merged.modules.some((m) => m.id === "m2"),
    false,
  );
});

test("includeUnpublished mantém não-publicadas e módulo", () => {
  const overrides = [
    {
      module_id: "m2",
      lesson_id: "c",
      published: false,
      order_index: null,
      title: null,
      duration: null,
      description: null,
      youtube_id: null,
      tella: null,
      updated_at: "",
    },
  ];
  const merged = mergeCourseWithOverrides(course, overrides, {
    includeUnpublished: true,
  });
  assert.equal(
    merged.modules.some((m) => m.id === "m2"),
    true,
  );
});
