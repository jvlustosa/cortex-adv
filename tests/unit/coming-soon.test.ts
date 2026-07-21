import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMING_SOON_MODULES,
  getComingSoonModules,
} from "../../src/lib/course/coming-soon.ts";

describe("getComingSoonModules", () => {
  it("exclui níveis 0 e 1 quando comece-aqui e fundacao-pratica estão publicados", () => {
    const mods = getComingSoonModules(["comece-aqui", "fundacao-pratica"]);
    assert.equal(mods.length, 6);
    assert.ok(mods.every((m) => !["0", "1"].some((lvl) => m.id.endsWith(lvl))));
    assert.equal(mods[0]?.title, "Economia do Claude");
  });

  it("mantém teaser mesmo com módulos extras no course.yml (instrucoes, skills)", () => {
    const mods = getComingSoonModules([
      "comece-aqui",
      "fundacao-pratica",
      "instrucoes-basicas",
      "skills",
    ]);
    assert.equal(mods.length, 6);
  });

  it("COMING_SOON_MODULES default reflete o course.yml atual", () => {
    assert.ok(COMING_SOON_MODULES.length >= 2);
    assert.ok(
      COMING_SOON_MODULES.some((m) => m.title === "Cowork"),
      "Cowork deve aparecer como em breve",
    );
  });
});
