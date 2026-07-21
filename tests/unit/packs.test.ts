import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PACKS,
  countPackItems,
  lessonHref,
  type LessonRefItem,
} from "@/data/packs";

const lessonRef = (over: Partial<LessonRefItem>): LessonRefItem => ({
  kind: "lesson-ref",
  name: "n",
  description: "d",
  ...over,
});

test("lessonHref: deep-link quando módulo e aula existem", () => {
  const href = lessonHref(lessonRef({ moduleId: "skills", lessonId: "intro" }));
  assert.equal(href, "/aulas/skills/intro");
});

test("lessonHref: null quando falta módulo ou aula", () => {
  assert.equal(lessonHref(lessonRef({ lessonId: "intro" })), null);
  assert.equal(lessonHref(lessonRef({ moduleId: "skills" })), null);
  assert.equal(lessonHref(lessonRef({})), null);
});

test("countPackItems: total = ready + teasers", () => {
  const packs = [
    {
      id: "p",
      icon: "skills" as const,
      title: "t",
      tagline: "tl",
      tags: [],
      items: [
        lessonRef({}),
        lessonRef({ status: "teaser" }),
        lessonRef({ status: "ready" }),
      ],
    },
  ];
  const { total, ready, teasers } = countPackItems(packs);
  assert.equal(ready, 2);
  assert.equal(teasers, 1);
  assert.equal(total, 3);
});

// Guardas sobre os dados reais: se alguém quebrar PACKS em produção, cai aqui.
test("PACKS reais: contagem consistente e não-vazia", () => {
  assert.ok(PACKS.length > 0);
  const { total, ready, teasers } = countPackItems(PACKS);
  assert.equal(total, ready + teasers);
  assert.equal(
    total,
    PACKS.reduce((sum, p) => sum + p.items.length, 0),
  );
});

test("PACKS reais: todo lesson-ref com deep-link resolve pra /aulas/<mod>/<aula>", () => {
  for (const pack of PACKS) {
    for (const item of pack.items) {
      if (item.kind !== "lesson-ref") continue;
      const href = lessonHref(item);
      // Ou não tem deep-link, ou o deep-link é bem-formado.
      if (item.moduleId && item.lessonId) {
        assert.equal(href, `/aulas/${item.moduleId}/${item.lessonId}`);
      } else {
        assert.equal(href, null);
      }
    }
  }
});
