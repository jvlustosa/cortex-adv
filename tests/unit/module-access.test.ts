import { test } from "node:test";
import assert from "node:assert/strict";
import { computeModuleAccess } from "@/lib/course/module-access";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-07-16T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();

test("sem unlockAfterDays: liberado na hora", () => {
  const a = computeModuleAccess(daysAgo(0), undefined, NOW);
  assert.equal(a.isUnlocked, true);
  assert.equal(a.unlockAt, null);
});

test("unlockAfterDays 0: liberado na hora", () => {
  assert.equal(computeModuleAccess(daysAgo(0), 0, NOW).isUnlocked, true);
});

test("trava de 8 dias: 7 dias após a matrícula ainda travado", () => {
  const a = computeModuleAccess(daysAgo(7), 8, NOW);
  assert.equal(a.isUnlocked, false);
  assert.equal(a.unlockAt, new Date(Date.parse(daysAgo(7)) + 8 * DAY).toISOString());
});

test("trava de 8 dias: exatamente 8 dias libera", () => {
  assert.equal(computeModuleAccess(daysAgo(8), 8, NOW).isUnlocked, true);
});

test("trava de 8 dias: 9 dias já liberado", () => {
  assert.equal(computeModuleAccess(daysAgo(9), 8, NOW).isUnlocked, true);
});

test("trava setada mas sem created_at: travado (nunca abre por omissão)", () => {
  const a = computeModuleAccess(null, 8, NOW);
  assert.equal(a.isUnlocked, false);
  assert.equal(a.unlockAt, null);
});

test("created_at inválido com trava: travado", () => {
  assert.equal(computeModuleAccess("não-é-data", 8, NOW).isUnlocked, false);
});
