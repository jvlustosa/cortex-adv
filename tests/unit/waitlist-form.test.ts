import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BRAZIL_DDI,
  buildWaitlistRequestBody,
  DDI_OPTIONS,
  findDdi,
  formatPhoneForDdi,
  validateWaitlistForm,
} from "@/lib/waitlist/form";
import { LEAD_KEY } from "@/lib/waitlist/lead";

const VALID = {
  nome: "Maria Teste",
  email: "maria@example.com",
  whatsapp: "(11) 98765-4321",
  ddi: BRAZIL_DDI,
  isClient: false,
};

const CONTEXT = {
  page: "/grupo",
  urlParams: "?utm_source=instagram",
  referrer: "https://instagram.com/",
  honeypot: "",
};

test("formulário completo passa na validação", () => {
  assert.equal(validateWaitlistForm(VALID), null);
});

test("nome, e-mail e telefone bloqueiam envio com mensagem em pt-BR", () => {
  assert.equal(
    validateWaitlistForm({ ...VALID, nome: "M" }),
    "Informe seu nome.",
  );
  assert.equal(
    validateWaitlistForm({ ...VALID, email: "semarroba" }),
    "Informe um e-mail válido.",
  );
  assert.equal(
    validateWaitlistForm({ ...VALID, whatsapp: "(11) 9876" }),
    "Informe o WhatsApp com DDD.",
  );
});

test("celular e fixo brasileiros (11 e 10 dígitos) passam", () => {
  assert.equal(validateWaitlistForm({ ...VALID, whatsapp: "11987654321" }), null);
  assert.equal(validateWaitlistForm({ ...VALID, whatsapp: "1132654321" }), null);
});

test("DDI estrangeiro usa o próprio limite de dígitos, não o do Brasil", () => {
  // 9 dígitos: inválido no BR, válido em Portugal.
  const nove = { ...VALID, whatsapp: "912345678" };
  assert.equal(
    validateWaitlistForm({ ...nove, ddi: BRAZIL_DDI }),
    "Informe o WhatsApp com DDD.",
  );
  assert.equal(validateWaitlistForm({ ...nove, ddi: "+351" }), null);
  assert.equal(
    validateWaitlistForm({ ...nove, ddi: "+1" }),
    "Informe o número de WhatsApp completo.",
  );
});

test("DDI desconhecido cai no Brasil em vez de quebrar", () => {
  assert.equal(findDdi("+999").value, BRAZIL_DDI);
  assert.equal(DDI_OPTIONS[0].value, BRAZIL_DDI);
});

test("máscara só formata número brasileiro", () => {
  assert.equal(formatPhoneForDdi(BRAZIL_DDI, "11987654321"), "(11) 98765-4321");
  assert.equal(formatPhoneForDdi(BRAZIL_DDI, "119876543219999"), "(11) 98765-4321");
  assert.equal(formatPhoneForDdi("+351", "912 345 678"), "912345678");
});

test("payload manda o telefone em E.164, sem máscara", () => {
  const body = buildWaitlistRequestBody(VALID, CONTEXT);

  assert.equal(body.whatsapp, "+5511987654321");
  assert.equal(body.whatsapp_ddi, BRAZIL_DDI);
  assert.equal(body.whatsapp_local, "(11) 98765-4321");
});

test("payload carrega origem e honeypot pro backend decidir", () => {
  const body = buildWaitlistRequestBody(
    { ...VALID, nome: "  Maria  ", email: " maria@example.com ", isClient: true },
    { ...CONTEXT, honeypot: "bot" },
  );

  assert.equal(body.nome, "Maria");
  assert.equal(body.email, "maria@example.com");
  assert.equal(body.is_client, true);
  assert.equal(body.page, "/grupo");
  assert.equal(body.url_params, "?utm_source=instagram");
  assert.equal(body.referrer, "https://instagram.com/");
  assert.equal(body.website, "bot");
});

test("chave de lead é a mesma do popup do site", () => {
  // Se divergir, quem já deixou os dados no chatjuridico.com.br é gateado de
  // novo aqui (e vice-versa). É contrato entre os dois repos.
  assert.equal(LEAD_KEY, "cj_claude_academy_lead");
});
