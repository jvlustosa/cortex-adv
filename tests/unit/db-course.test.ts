import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapDbToCourse,
  type CourseRow,
  type ModuleRow,
  type LessonRow,
} from "@/lib/lessons/db-course";

const course: CourseRow = {
  slug: "c",
  title: "T",
  subtitle: "S",
  published: true,
};

const modules: ModuleRow[] = [
  {
    slug: "m2",
    title: "M2",
    description: "d2",
    thumbnail_gradient: "g2",
    cover_image: null,
    unlock_after_days: 3,
    sort_order: 1,
    published: true,
  },
  {
    slug: "m1",
    title: "M1",
    description: "d1",
    thumbnail_gradient: "g1",
    cover_image: "cover.png",
    unlock_after_days: null,
    sort_order: 0,
    published: true,
  },
];

const lessons: LessonRow[] = [
  { module_slug: "m1", slug: "b", title: "B", duration: "2 min", youtube_id: null, tella: "yt-b", description: "db", sort_order: 1, published: true },
  { module_slug: "m1", slug: "a", title: "A", duration: "1 min", youtube_id: "abc", tella: null, description: "da", sort_order: 0, published: true },
  { module_slug: "m2", slug: "c", title: "C", duration: null, youtube_id: null, tella: null, description: null, sort_order: 0, published: true },
];

test("ordena módulos e aulas por sort_order", () => {
  const mapped = mapDbToCourse(course, modules, lessons);
  assert.deepEqual(mapped.modules.map((m) => m.id), ["m1", "m2"]);
  assert.deepEqual(
    mapped.modules.find((m) => m.id === "m1")!.lessons.map((l) => l.id),
    ["a", "b"],
  );
});

test("mapeia campos DB → shape de runtime", () => {
  const mapped = mapDbToCourse(course, modules, lessons);
  assert.equal(mapped.title, "T");
  assert.equal(mapped.subtitle, "S");

  const m1 = mapped.modules.find((m) => m.id === "m1")!;
  assert.equal(m1.description, "d1");
  assert.equal(m1.thumbnailGradient, "g1");
  assert.equal(m1.coverImage, "cover.png");
  assert.equal(m1.unlockAfterDays, undefined); // null → undefined

  const a = m1.lessons.find((l) => l.id === "a")!;
  assert.equal(a.duration, "1 min");
  assert.equal(a.youtubeId, "abc");
  assert.equal(a.tella, undefined);
  assert.equal(a.description, "da");

  const b = m1.lessons.find((l) => l.id === "b")!;
  assert.equal(b.tella, "yt-b");
  assert.equal(b.youtubeId, undefined);
});

test("null vira string vazia em duration/description", () => {
  const mapped = mapDbToCourse(course, modules, lessons, { includeUnpublished: true });
  const c = mapped.modules.find((m) => m.id === "m2")!.lessons[0];
  assert.equal(c.duration, "");
  assert.equal(c.description, "");
});

test("filtra aula não-publicada e dropa módulo vazio", () => {
  const withUnpub: LessonRow[] = [
    { ...lessons[2], published: false }, // m2/c despublicada → m2 fica vazio
    lessons[0],
    lessons[1],
  ];
  const mapped = mapDbToCourse(course, modules, withUnpub);
  assert.equal(mapped.modules.some((m) => m.id === "m2"), false);
  assert.equal(mapped.modules.some((m) => m.id === "m1"), true);
});

test("includeUnpublished mantém aula/módulo não-publicados", () => {
  const withUnpub: LessonRow[] = [
    { ...lessons[2], published: false },
    lessons[0],
    lessons[1],
  ];
  const mapped = mapDbToCourse(course, modules, withUnpub, {
    includeUnpublished: true,
  });
  assert.equal(mapped.modules.some((m) => m.id === "m2"), true);
});

test("módulo não-publicado é escondido do aluno mas visível com includeUnpublished", () => {
  const mods: ModuleRow[] = [
    { ...modules[1], published: true }, // m1
    { ...modules[0], published: false }, // m2 despublicado
  ];
  const aluno = mapDbToCourse(course, mods, lessons);
  assert.equal(aluno.modules.some((m) => m.id === "m2"), false);

  const admin = mapDbToCourse(course, mods, lessons, { includeUnpublished: true });
  assert.equal(admin.modules.some((m) => m.id === "m2"), true);
});

test("curso não-publicado esconde tudo do aluno", () => {
  const unpub: CourseRow = { ...course, published: false };
  assert.equal(mapDbToCourse(unpub, modules, lessons).modules.length, 0);
  assert.ok(
    mapDbToCourse(unpub, modules, lessons, { includeUnpublished: true }).modules.length > 0,
  );
});

test("módulo coming_soon sai da grade e vira card em comingSoonModules", () => {
  const mods: ModuleRow[] = [
    modules[1], // m1 ao vivo (tem aulas a, b)
    {
      slug: "m3",
      title: "M3 em breve",
      description: "teaser 3",
      thumbnail_gradient: null,
      cover_image: null,
      unlock_after_days: null,
      sort_order: 5,
      published: false,
      coming_soon: true,
    },
  ];
  const mapped = mapDbToCourse(course, mods, lessons);
  assert.equal(
    mapped.modules.some((m) => m.id === "m3"),
    false,
  );
  assert.equal(
    mapped.modules.some((m) => m.id === "m1"),
    true,
  );
  assert.deepEqual(
    (mapped.comingSoonModules ?? []).map((c) => c.title),
    ["M3 em breve"],
  );
  assert.equal(mapped.comingSoonModules?.[0].teaser, "teaser 3");
});
