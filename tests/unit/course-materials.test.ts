import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  COURSE_MATERIALS,
  FREE_MATERIALS,
  MATERIAL_CATEGORIES,
  MEMBER_MATERIALS,
  findCourseMaterial,
  filterMaterials,
  findFreeMaterial,
  groupMaterialsByCategory,
  publishedMaterials,
  type CourseMaterial,
} from "@/data/materiais";

test("ids únicos entre gratuitas e exclusivas", () => {
  // O id é a chave do download e do PDF na pasta do upload: repetir um id
  // faria um aluno baixar a apostila errada.
  const ids = COURSE_MATERIALS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("Materiais Didáticos trazem todas as gratuitas e todas as exclusivas", () => {
  assert.equal(
    COURSE_MATERIALS.length,
    FREE_MATERIALS.length + MEMBER_MATERIALS.length,
  );
  for (const m of FREE_MATERIALS) {
    assert.equal(findCourseMaterial(m.id)?.exclusive, false);
  }
  for (const m of MEMBER_MATERIALS) {
    assert.equal(findCourseMaterial(m.id)?.exclusive, true);
  }
});

test("exclusivas não saem pela rota pública de /materiais", () => {
  for (const m of MEMBER_MATERIALS) {
    assert.equal(findFreeMaterial(m.id), undefined);
  }
});

test("toda apostila tem descrição para o aluno escolher", () => {
  for (const m of COURSE_MATERIALS) {
    assert.ok(m.description.trim().length > 0, `${m.id} sem descrição`);
  }
});

test("categorias com id único, título e descrição", () => {
  const ids = MATERIAL_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of MATERIAL_CATEGORIES) {
    assert.ok(c.title.trim().length > 0, `${c.id} sem título`);
    assert.ok(c.description.trim().length > 0, `${c.id} sem descrição`);
  }
});

test("toda apostila aparece em exatamente uma categoria da página", () => {
  const grouped = groupMaterialsByCategory(COURSE_MATERIALS).flatMap((g) =>
    g.materials.map((m) => m.id),
  );
  assert.deepEqual(
    [...grouped].sort(),
    COURSE_MATERIALS.map((m) => m.id).sort(),
  );
});

test("agrupa na ordem das categorias, mantém a ordem da lista e esconde vazias", () => {
  const [first, second] = MATERIAL_CATEGORIES;
  const base = COURSE_MATERIALS[0];
  const fake = (id: string, category: CourseMaterial["category"]) => ({
    ...base,
    id,
    category,
  });

  // Lista fora de ordem: a página segue MATERIAL_CATEGORIES, não a lista.
  const groups = groupMaterialsByCategory([
    fake("b1", second.id),
    fake("a1", first.id),
    fake("a2", first.id),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.category.id, g.materials.map((m) => m.id)]),
    [
      [first.id, ["a1", "a2"]],
      [second.id, ["b1"]],
    ],
  );

  const onlySecond = groupMaterialsByCategory([fake("b1", second.id)]);
  assert.deepEqual(
    onlySecond.map((g) => g.category.id),
    [second.id],
  );
});

test("busca ignora acento e maiúscula e procura em título, descrição, tópicos e volume", () => {
  const ids = (query: string) =>
    filterMaterials(COURSE_MATERIALS, { query }).map((m) => m.id);

  assert.deepEqual(ids("conferencia"), ["02"]); // título "Conferência"
  assert.deepEqual(ids("ALUCINAÇÃO"), ["02"]); // descrição
  assert.deepEqual(ids("revisao adversarial"), ["02"]); // tópico, duas palavras
  assert.deepEqual(ids("masterclass"), ["05"]); // volume
  assert.deepEqual(ids("  "), COURSE_MATERIALS.map((m) => m.id));
  assert.deepEqual(ids("xyzzy"), []);
});

test("cada palavra da busca precisa aparecer (não é OU)", () => {
  // "skill" aparece em várias; "BACEN" só na 08.
  const hits = filterMaterials(COURSE_MATERIALS, { query: "skill bacen" });
  assert.deepEqual(hits.map((m) => m.id), ["08"]);
});

test("filtro por categoria combina com a busca", () => {
  const extras = filterMaterials(COURSE_MATERIALS, { category: "extras" });
  assert.ok(extras.length > 0);
  assert.ok(extras.every((m) => m.category === "extras"));

  // "skill" existe na trilha (03) e nos extras (05); com categoria, só extras.
  const skillExtras = filterMaterials(COURSE_MATERIALS, {
    query: "skill",
    category: "extras",
  });
  assert.ok(skillExtras.length > 0);
  assert.ok(skillExtras.every((m) => m.category === "extras"));
  assert.ok(!skillExtras.some((m) => m.id === "03"));
});

test("cadastro: capa existe em public/, caminho do PDF único e exclusiva em membros/", () => {
  for (const m of COURSE_MATERIALS) {
    assert.ok(
      existsSync(join(process.cwd(), "public", m.cover)),
      `${m.id}: capa ${m.cover} não existe em public/`,
    );
    assert.ok(m.filePath.endsWith(".pdf"), `${m.id}: filePath precisa terminar em .pdf`);
    assert.ok(m.fileName.endsWith(".pdf"), `${m.id}: fileName precisa terminar em .pdf`);
  }
  for (const m of MEMBER_MATERIALS) {
    assert.ok(
      m.filePath.startsWith("membros/"),
      `${m.id}: exclusiva deve ficar em membros/ no bucket`,
    );
  }
  const paths = COURSE_MATERIALS.map((m) => m.filePath);
  assert.equal(new Set(paths).size, paths.length, "dois cadastros no mesmo PDF");
});

test("aluno só vê apostila com PDF no bucket, com o tamanho real", () => {
  const [a, b] = COURSE_MATERIALS;
  const stored = new Map([[b.filePath, { size: 1234, updatedAt: null }]]);

  const visible = publishedMaterials([a, b], stored);
  assert.deepEqual(visible.map((m) => m.id), [b.id]);
  assert.equal(visible[0].sizeBytes, 1234);
  assert.deepEqual(publishedMaterials([a, b], new Map()), []);
});
