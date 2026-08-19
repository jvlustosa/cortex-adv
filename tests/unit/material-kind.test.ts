import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isHtmlFragment,
  isRenderable,
  materialAspect,
  materialExtension,
  materialKind,
  previewExcerpt,
} from "@/lib/lessons/material-kind";

test("extensão manda mais que o content-type do upload", () => {
  // Browser sobe .md/.html sem MIME; o arquivo vira octet-stream no Storage.
  assert.equal(materialKind("skill.md", "application/octet-stream"), "markdown");
  assert.equal(materialKind("apostila.html", ""), "html");
  assert.equal(materialKind("apostila.pdf", null), "pdf");
  assert.equal(materialKind("APOSTILA.PDF", null), "pdf");
});

test("sem extensão conhecida, cai no content-type", () => {
  assert.equal(materialKind("arquivo", "application/pdf"), "pdf");
  assert.equal(materialKind("arquivo", "image/png"), "image");
  assert.equal(materialKind("arquivo", "text/markdown"), "markdown");
  assert.equal(materialKind("arquivo", "text/plain"), "text");
  assert.equal(materialKind("arquivo", null), "other");
});

test("skills em json/yaml e planilhas csv abrem como texto", () => {
  assert.equal(materialKind("skill.json", ""), "text");
  assert.equal(materialKind("skill.yaml", ""), "text");
  assert.equal(materialKind("skill.yml", ""), "text");
  assert.equal(materialKind("modelo.csv", ""), "text");
});

test("formato de escritório não renderiza: vira download", () => {
  for (const name of ["apostila.docx", "aula.pptx", "planilha.xlsx", "skills.zip"]) {
    assert.equal(materialKind(name, ""), "other", name);
    assert.equal(isRenderable(materialKind(name, "")), false, name);
  }
});

test("tudo que não é 'other' abre no visualizador", () => {
  for (const k of ["markdown", "html", "pdf", "image", "text"] as const) {
    assert.equal(isRenderable(k), true, k);
  }
});

test("extensão para o selo da lista", () => {
  assert.equal(materialExtension("Apostila Aula 1.pdf"), "pdf");
  assert.equal(materialExtension("arquivo.tar.gz"), "gz");
  assert.equal(materialExtension("sem-extensao"), "");
});

test("HTML solto é fragmento; documento completo passa intacto", () => {
  // Fragmento não traz <head>, então precisa da nossa folha de estilo — sem
  // isso a apostila renderiza preto-no-branco dentro do modal escuro.
  assert.equal(isHtmlFragment("<h1>Apostila</h1><p>texto</p>"), true);
  assert.equal(isHtmlFragment("  \n<div>oi</div>"), true);
  assert.equal(isHtmlFragment("<!DOCTYPE html><html><body>x</body></html>"), false);
  assert.equal(isHtmlFragment("<html lang='pt-BR'><body>x</body></html>"), false);
  assert.equal(isHtmlFragment("<body>x</body>"), false);
});

test("apresentação é 16:9; apostila e documento são A4", () => {
  // Extensão de slide manda sozinha.
  assert.equal(materialAspect("aula.pptx", "other"), "slide");
  assert.equal(materialAspect("deck.key", "other"), "slide");
  assert.equal(materialAspect("aula.odp", "other"), "slide");

  // PDF é ambíguo: o nome decide.
  assert.equal(materialAspect("slides-aula-3.pdf", "pdf"), "slide");
  assert.equal(materialAspect("Apresentação Módulo 2.pdf", "pdf"), "slide");
  assert.equal(materialAspect("deck-comercial.pdf", "pdf"), "slide");
  assert.equal(materialAspect("apostila-modulo-2.pdf", "pdf"), "page");
  assert.equal(materialAspect("contrato.pdf", "pdf"), "page");

  // Texto é sempre documento, mesmo com nome de slide.
  assert.equal(materialAspect("slides.md", "markdown"), "page");
  assert.equal(materialAspect("apostila.docx", "other"), "page");
});

test("excerpt tira a marcação e sobra texto legível", () => {
  assert.equal(
    previewExcerpt("# Título\n\nTexto com **negrito** e `código`.", "markdown"),
    "Título\nTexto com negrito e código.",
  );
  assert.equal(
    previewExcerpt("- item um\n- item dois", "markdown"),
    "item um\nitem dois",
  );
  assert.equal(
    previewExcerpt("[Clique aqui](https://exemplo.com) agora", "markdown"),
    "Clique aqui agora",
  );
});

test("excerpt de HTML descarta script, style e tags", () => {
  const html =
    "<style>.x{color:red}</style><h1>Apostila</h1><script>alert(1)</script><p>Corpo do&nbsp;texto</p>";
  assert.equal(previewExcerpt(html, "html"), "Apostila\nCorpo do texto");
});

test("excerpt corta arquivo longo sem estourar o card", () => {
  const out = previewExcerpt("palavra ".repeat(500), "text");
  assert.ok(out.length <= 400, `tamanho ${out.length}`);
});
