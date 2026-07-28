import { test } from "node:test";
import assert from "node:assert/strict";
import { packItemDownloadPath, parseSetupSteps } from "@/lib/packs/items";
import { canAccessPackItem, canDownloadPackItem } from "@/lib/packs/load-packs";
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

test("canAccessPackItem: amostra libera antes da garantia", () => {
  assert.equal(canAccessPackItem("amostra", false), true);
  assert.equal(canAccessPackItem("premium", false), false);
  assert.equal(canAccessPackItem("premium", true), true);
  assert.equal(canAccessPackItem(undefined, true), true);
});

test("canDownloadPackItem: só skill-file pronto e liberado baixa", () => {
  const item = (over: Partial<Parameters<typeof canDownloadPackItem>[0]>) => ({
    kind: "skill-file",
    status: "ready",
    tier: "premium" as const,
    ...over,
  });

  assert.equal(canDownloadPackItem(item({}), true), true);
  // Galeria travada (dentro da garantia) não baixa premium, mas baixa amostra.
  assert.equal(canDownloadPackItem(item({}), false), false);
  assert.equal(canDownloadPackItem(item({ tier: "amostra" }), false), true);
  // Teaser não tem arquivo pra entregar, mesmo liberado.
  assert.equal(canDownloadPackItem(item({ status: "teaser" }), true), false);
  // Conector e referência de aula não passam pela rota de download.
  assert.equal(canDownloadPackItem(item({ kind: "remote-connector" }), true), false);
  assert.equal(canDownloadPackItem(item({ kind: "lesson-ref" }), true), false);
});

test("packItemDownloadPath: id vai escapado na query", () => {
  assert.equal(packItemDownloadPath("abc"), "/api/packs/download?id=abc");
  assert.equal(
    packItemDownloadPath("a b&c"),
    "/api/packs/download?id=a%20b%26c",
  );
});

test("parseSetupSteps: uma linha por passo", () => {
  assert.deepEqual(parseSetupSteps("a\n\nb\n c "), ["a", "b", "c"]);
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
      if (item.moduleId && item.lessonId) {
        assert.equal(href, `/aulas/${item.moduleId}/${item.lessonId}`);
      } else {
        assert.equal(href, null);
      }
    }
  }
});
