import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fillLessonFromCatalog,
  isCatalogLesson,
} from "../../src/lib/lessons/catalog-fallback.ts";

describe("catalog-fallback", () => {
  it("reconhece aula do catálogo", () => {
    assert.equal(isCatalogLesson("comece-aqui", "o-que-e-claude"), true);
    assert.equal(isCatalogLesson("comece-aqui", "slug-inexistente"), false);
  });

  it("preenche tella vazio do catálogo", () => {
    const filled = fillLessonFromCatalog("comece-aqui", "o-que-e-claude", {
      title: "O que é o Claude?",
      duration: null,
      tella: null,
      youtube_id: null,
      description: null,
    });
    assert.equal(filled.tella, "01-ca-1-o-que-e-o-claude-f528");
    assert.equal(filled.duration, "3:32");
  });

  it("não sobrescreve tella já preenchido", () => {
    const filled = fillLessonFromCatalog("comece-aqui", "o-que-e-claude", {
      tella: "custom-slug",
    });
    assert.equal(filled.tella, "custom-slug");
  });
});
