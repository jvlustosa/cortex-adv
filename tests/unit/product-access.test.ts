import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fallbackHome,
  hasProductAccess,
  isProduct,
  PRODUCT_HOME,
} from "@/lib/access/products";

test("hasProductAccess: curso inclui o Degravação", () => {
  assert.equal(hasProductAccess(["curso"], "curso"), true);
  assert.equal(hasProductAccess(["curso"], "degravacao"), true);
});

test("hasProductAccess: Degravação avulso não dá o curso", () => {
  assert.equal(hasProductAccess(["degravacao"], "degravacao"), true);
  assert.equal(hasProductAccess(["degravacao"], "curso"), false);
});

test("hasProductAccess: conta sem produto não acessa nada", () => {
  assert.equal(hasProductAccess([], "curso"), false);
  assert.equal(hasProductAccess([], "degravacao"), false);
});

test("fallbackHome: manda para a home do produto que a conta tem", () => {
  assert.equal(fallbackHome(["degravacao"]), PRODUCT_HOME.degravacao);
  assert.equal(fallbackHome(["curso"]), PRODUCT_HOME.curso);
  assert.equal(fallbackHome([]), null);
});

test("isProduct: só aceita os produtos da migration 019", () => {
  assert.equal(isProduct("curso"), true);
  assert.equal(isProduct("degravacao"), true);
  assert.equal(isProduct("Degravacao"), false);
  assert.equal(isProduct(undefined), false);
  assert.equal(isProduct(1), false);
});
