import { test } from "node:test";
import assert from "node:assert/strict";
import { compareLessons, nextOrderIndex } from "@/lib/lessons/ordering";

const cat = (i: number, title: string) => ({
  orderIndex: null,
  catalogIndex: i,
  title,
});
const withOrder = (o: number, title: string) => ({
  orderIndex: o,
  catalogIndex: null,
  title,
});

test("sem order_index: mantém ordem do catálogo", () => {
  const items = [cat(1, "b"), cat(0, "a")];
  items.sort(compareLessons);
  assert.deepEqual(
    items.map((i) => i.title),
    ["a", "b"],
  );
});

test("order_index vence catalogIndex", () => {
  const items = [
    { orderIndex: 5, catalogIndex: 0, title: "a" },
    cat(1, "b"),
  ];
  items.sort(compareLessons);
  assert.deepEqual(
    items.map((i) => i.title),
    ["b", "a"],
  );
});

test("empate: catálogo antes de custom, depois título", () => {
  const items = [
    withOrder(2, "z-custom"),
    { orderIndex: 2, catalogIndex: 9, title: "cat" },
  ];
  items.sort(compareLessons);
  assert.deepEqual(
    items.map((i) => i.title),
    ["cat", "z-custom"],
  );
});

test("nextOrderIndex: max da ordem efetiva + 1", () => {
  assert.equal(nextOrderIndex([cat(0, "a"), cat(1, "b")]), 2);
  assert.equal(nextOrderIndex([]), 0);
});
