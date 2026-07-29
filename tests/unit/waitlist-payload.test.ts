import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWaitlistForwardPayload,
  parseWaitlistPayload,
  resolveWaitlistForwardUrl,
  validateWaitlistPayload,
} from "@/lib/waitlist/payload";

/** Corpo exato que o form manda (buildWaitlistRequestBody). */
const BROWSER_BODY = {
  nome: "Maria Teste",
  email: "maria@example.com",
  whatsapp: "+5511987654321",
  whatsapp_ddi: "+55",
  whatsapp_local: "(11) 98765-4321",
  is_client: true,
  page: "/grupo",
  url_params: "?utm_source=instagram",
  referrer: "https://instagram.com/",
  website: "",
};

test("payload encaminhado usa os nomes de campo que o handler do site lê", () => {
  const data = parseWaitlistPayload(BROWSER_BODY);
  assert.equal(validateWaitlistPayload(data).ok, true);

  const forward = buildWaitlistForwardPayload(data);

  // `page` (não `pagina`) e `whatsapp` já com "+" — é o que o site espera.
  assert.deepEqual(forward, {
    nome: "Maria Teste",
    email: "maria@example.com",
    whatsapp: "+5511987654321",
    whatsapp_ddi: "+55",
    is_client: true,
    page: "/grupo",
    referrer: "https://instagram.com/",
    url_params: "?utm_source=instagram",
    fonte: "claude-academy",
  });
});

test("destino default é o mesmo endpoint do popup do site", () => {
  const previous = process.env.WAITLIST_FORWARD_URL;
  delete process.env.WAITLIST_FORWARD_URL;

  assert.equal(
    resolveWaitlistForwardUrl(),
    "https://chatjuridico.com.br/api/claude-academy-waitlist/",
  );

  process.env.WAITLIST_FORWARD_URL = "https://exemplo.test/hook";
  assert.equal(resolveWaitlistForwardUrl(), "https://exemplo.test/hook");

  if (previous === undefined) delete process.env.WAITLIST_FORWARD_URL;
  else process.env.WAITLIST_FORWARD_URL = previous;
});

test("WhatsApp fora da faixa não passa na validação", () => {
  const curto = parseWaitlistPayload({ ...BROWSER_BODY, whatsapp: "+55119876" });
  assert.equal(validateWaitlistPayload(curto).ok, false);
});
