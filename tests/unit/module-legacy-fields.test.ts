import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { moduleLegacyLevelFields } from "../../src/lib/lessons/module-legacy-fields.ts";

describe("moduleLegacyLevelFields", () => {
  it("módulo ao vivo usa sort_order como level", () => {
    assert.deepEqual(moduleLegacyLevelFields(4, false), {
      level_key: "4",
      level_num: 4,
    });
  });

  it("em breve usa bonus sem level_num", () => {
    assert.deepEqual(moduleLegacyLevelFields(9, true), {
      level_key: "bonus",
      level_num: null,
    });
  });
});
