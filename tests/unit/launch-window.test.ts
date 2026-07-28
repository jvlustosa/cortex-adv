import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getLaunchPhase,
  isCheckoutOpen,
  LAUNCH_CLOSES_AT,
  LAUNCH_OPENS_AT,
  SALES_MODE,
} from "@/lib/launch-window";

const BEFORE = new Date(LAUNCH_OPENS_AT.getTime() - 60_000);
const DURING = new Date(LAUNCH_OPENS_AT.getTime() + 60_000);
const AFTER = new Date(LAUNCH_CLOSES_AT.getTime() + 60_000);

test("modo perpétuo mantém a matrícula aberta em qualquer data", () => {
  for (const now of [BEFORE, DURING, AFTER]) {
    assert.equal(getLaunchPhase(now, "evergreen"), "evergreen");
    assert.equal(isCheckoutOpen(getLaunchPhase(now, "evergreen")), true);
  }
});

test("modo turma respeita a janela de datas", () => {
  assert.equal(getLaunchPhase(BEFORE, "cohort"), "before");
  assert.equal(getLaunchPhase(DURING, "cohort"), "live");
  assert.equal(getLaunchPhase(AFTER, "cohort"), "closed");

  assert.equal(isCheckoutOpen("before"), false);
  assert.equal(isCheckoutOpen("live"), true);
  assert.equal(isCheckoutOpen("closed"), false);
});

test("pré-hidratação (fase desconhecida) nunca abre o checkout", () => {
  assert.equal(isCheckoutOpen(null), false);
});

test("o modo em produção é o perpétuo", () => {
  // Guarda a decisão de vender no perpétuo: voltar pra turma tem que ser
  // explícito (trocar a flag + as datas), não um efeito colateral.
  assert.equal(SALES_MODE, "evergreen");
});
