import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  COURSE_MATERIALS,
  FREE_MATERIALS,
  MATERIAL_CATEGORIES,
  MEMBER_MATERIALS,
  filterMaterials,
  groupMaterialsByCategory,
  publishedMaterials,
  type CourseMaterial,
} from "@/data/materiais";
import {
  catalogFromList,
  createMaterial,
  deleteMaterial,
  downloadFileName,
  isCoverFileName,
  isCoverPathFor,
  materialCoverSrc,
  nextMaterialId,
  parseMaterialInput,
  parseStoredCatalog,
  pdfFilePath,
  updateMaterial,
  type MaterialInput,
} from "@/lib/materials/catalog-rules";

test("ids únicos entre gratuitas e exclusivas", () => {
  // O id é a chave do download e do PDF na pasta do upload: repetir um id
  // faria um aluno baixar a apostila errada.
  const ids = COURSE_MATERIALS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("catálogo inicial: gratuitas e exclusivas marcadas certo", () => {
  assert.equal(
    COURSE_MATERIALS.length,
    FREE_MATERIALS.length + MEMBER_MATERIALS.length,
  );
  const exclusiveById = new Map(COURSE_MATERIALS.map((m) => [m.id, m.exclusive]));
  for (const m of FREE_MATERIALS) assert.equal(exclusiveById.get(m.id), false);
  for (const m of MEMBER_MATERIALS) assert.equal(exclusiveById.get(m.id), true);
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

// --- Catálogo editado pelo /admin (src/lib/materials/catalog-rules.ts) ---

const validInput: MaterialInput = {
  title: "Prompts para Petições",
  volume: "Vol. 5",
  description: "Como pedir uma petição inicial sem retrabalho.",
  topics: ["Estrutura do pedido", "Revisão"],
  pages: 12,
  category: "trilha",
  exclusive: true,
};

test("apostila nova continua a numeração e ganha caminho e nome de download", () => {
  const seed = catalogFromList(COURSE_MATERIALS);
  const { catalog, material } = createMaterial(seed, validInput);

  assert.equal(material.id, "09");
  assert.equal(material.filePath, "membros/apostila-09-prompts-para-peticoes.pdf");
  assert.equal(material.fileName, "Claude-Academy-09-Prompts-Para-Peticoes.pdf");
  assert.equal(material.cover, "");
  assert.equal(catalog.materials.length, COURSE_MATERIALS.length + 1);
  assert.equal(catalog.lastId, 9);

  const free = createMaterial(seed, { ...validInput, exclusive: false }).material;
  assert.ok(!free.filePath.startsWith("membros/"));
});

test("id de apostila excluída não é reaproveitado", () => {
  const seed = catalogFromList(COURSE_MATERIALS);
  const { catalog } = createMaterial(seed, validInput);
  const afterDelete = deleteMaterial(catalog, "09");
  assert.ok(afterDelete);
  assert.equal(nextMaterialId(afterDelete.catalog), "10");
  assert.equal(deleteMaterial(catalog, "nao-existe"), null);
});

test("editar o título renomeia o download, mas não move o PDF", () => {
  const seed = catalogFromList(COURSE_MATERIALS);
  const original = seed.materials.find((m) => m.id === "02")!;

  const renamed = updateMaterial(seed, "02", { title: "Conferência na prática" });
  assert.ok(renamed);
  assert.equal(renamed.material.title, "Conferência na prática");
  assert.equal(renamed.material.filePath, original.filePath);
  assert.equal(renamed.material.fileName, downloadFileName("02", "Conferência na prática"));

  const sameTitle = updateMaterial(seed, "02", { pages: 99 });
  assert.equal(sameTitle?.material.fileName, original.fileName);
  assert.equal(updateMaterial(seed, "nao-existe", { pages: 1 }), null);
});

test("validação do formulário do admin", () => {
  const ok = parseMaterialInput({ ...validInput, topics: [" a ", "", "b"] }, { partial: false });
  assert.ok(ok.ok);
  assert.deepEqual(ok.value.topics, ["a", "b"]);

  const bad = (body: Record<string, unknown>) =>
    parseMaterialInput({ ...validInput, ...body }, { partial: false }).ok;
  assert.equal(bad({ title: "  " }), false);
  assert.equal(bad({ description: "" }), false);
  assert.equal(bad({ pages: 0 }), false);
  assert.equal(bad({ pages: "abc" }), false);
  assert.equal(bad({ category: "inexistente" }), false);
  assert.equal(bad({ exclusive: "sim" }), false);

  // Edição: só confere o que veio.
  const partial = parseMaterialInput({ title: "Novo nome" }, { partial: true });
  assert.ok(partial.ok);
  assert.deepEqual(partial.value, { title: "Novo nome" });
});

test("capa enviada pelo admin: caminho preso à apostila e servido pela rota", () => {
  assert.ok(isCoverPathFor("09", "capas/09-1730000000000.webp"));
  assert.ok(!isCoverPathFor("09", "capas/10-1730000000000.webp"));
  assert.ok(!isCoverPathFor("09", "capas/09-1730000000000.svg"));
  assert.ok(!isCoverPathFor("09", "membros/apostila-09.pdf"));
  assert.ok(!isCoverPathFor("09", "capas/../catalogo.json"));
  assert.ok(!isCoverFileName("..%2Fcatalogo.json"));

  assert.equal(
    materialCoverSrc("capas/09-1730000000000.webp"),
    "/api/materiais/capa/09-1730000000000.webp",
  );
  assert.equal(
    materialCoverSrc("/assets/images/materiais/apostila-01.webp"),
    "/assets/images/materiais/apostila-01.webp",
  );
  assert.equal(materialCoverSrc(""), null);
});

test("catalogo.json: ida e volta preserva o cadastro e descarta entrada quebrada", () => {
  const seed = catalogFromList(COURSE_MATERIALS);
  const parsed = parseStoredCatalog(JSON.parse(JSON.stringify(seed)));
  assert.ok(parsed);
  // O tamanho não vai para o JSON (vem do bucket); o resto tem que bater.
  const withoutSize = (list: CourseMaterial[]) =>
    list.map((m) => ({ ...m, sizeBytes: undefined }));
  assert.deepEqual(withoutSize(parsed.materials), withoutSize(seed.materials));

  const broken = parseStoredCatalog({
    version: 1,
    lastId: 3,
    materials: [
      { ...seed.materials[0] },
      { id: "x", category: "apagada", filePath: "x.pdf" },
      null,
    ],
  });
  assert.deepEqual(broken?.materials.map((m) => m.id), [seed.materials[0].id]);
  assert.equal(parseStoredCatalog({ version: 2, materials: [] }), null);
  assert.equal(parseStoredCatalog("lixo"), null);
});

test("caminho do PDF é estável e sem acento", () => {
  assert.equal(pdfFilePath("12", "Ação & Reação: 2ª edição", false), "apostila-12-acao-reacao-2-edicao.pdf");
});
