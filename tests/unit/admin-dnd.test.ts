import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dropPositionFromPointer,
  resolveDropTarget,
} from "../../src/lib/admin/dnd.ts";

describe("dropPositionFromPointer", () => {
  const rect = { top: 100, height: 40 };

  it("metade superior → before", () => {
    assert.equal(dropPositionFromPointer(110, rect), "before");
  });

  it("metade inferior → after", () => {
    assert.equal(dropPositionFromPointer(130, rect), "after");
  });
});

describe("resolveDropTarget", () => {
  const groups = [
    {
      moduleId: "mod-a",
      lessons: [
        { moduleId: "mod-a", lessonId: "l1" },
        { moduleId: "mod-a", lessonId: "l2" },
      ],
    },
  ];

  it("before retorna a chave alvo", () => {
    assert.equal(
      resolveDropTarget(groups, "mod-a", "mod-a:l2", "before"),
      "mod-a:l2",
    );
  });

  it("after retorna a próxima aula", () => {
    assert.equal(
      resolveDropTarget(groups, "mod-a", "mod-a:l1", "after"),
      "mod-a:l2",
    );
  });

  it("after na última aula → null (fim do módulo)", () => {
    assert.equal(
      resolveDropTarget(groups, "mod-a", "mod-a:l2", "after"),
      null,
    );
  });
});
