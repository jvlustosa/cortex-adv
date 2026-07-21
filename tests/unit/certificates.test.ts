import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getCertificateForUser,
  getOrIssueCertificate,
} from "@/lib/certificates/issue";

// Estado "Supabase desligado": emissão/leitura de certificado deve retornar
// null (nunca lançar, nunca chamar createAdminClient) — o /certificado degrada
// em vez de quebrar quando o env não está configurado em produção.
process.env.NODE_ENV = "test";
delete process.env.NEXT_PUBLIC_SUPABASE_ENABLED;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

test("getCertificateForUser: Supabase off → null", async () => {
  assert.equal(await getCertificateForUser("user-123"), null);
});

test("getOrIssueCertificate: Supabase off → null (não tenta inserir)", async () => {
  const cert = await getOrIssueCertificate({
    userId: "user-123",
    recipientName: "Fulano de Tal",
  });
  assert.equal(cert, null);
});
