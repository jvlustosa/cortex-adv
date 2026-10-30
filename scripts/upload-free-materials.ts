/**
 * Sobe as apostilas (gratuitas de /materiais + exclusivas de alunos) para o
 * bucket privado do Storage.
 *
 * Uso:
 *   npm run materiais:upload -- <pasta>
 *
 * A pasta precisa ter um PDF por apostila com o id como nome (01.pdf, 02.pdf…),
 * cobrindo todas as de COURSE_MATERIALS em src/data/materiais.ts.
 * Cria o bucket se faltar e sobrescreve o objeto (upsert), então dá pra rodar
 * de novo quando uma apostila for atualizada. Se o tamanho do arquivo mudar,
 * atualize `sizeBytes` em src/data/materiais.ts (o script avisa).
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { COURSE_MATERIALS, FREE_MATERIALS_BUCKET } from "../src/data/materiais";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename: string) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error("Uso: npm run materiais:upload -- <pasta com 01.pdf, 02.pdf…>");
    process.exit(1);
  }

  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
    process.exit(1);
  }

  const missing = COURSE_MATERIALS.filter(
    (m) => !existsSync(resolve(sourceDir, `${m.id}.pdf`)),
  );
  if (missing.length > 0) {
    console.error(`Faltam na pasta: ${missing.map((m) => `${m.id}.pdf`).join(", ")}`);
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: bucket } = await admin.storage.getBucket(FREE_MATERIALS_BUCKET);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(FREE_MATERIALS_BUCKET, {
      public: false,
    });
    if (error) throw error;
    console.log(`Bucket ${FREE_MATERIALS_BUCKET} criado (privado).`);
  } else if (bucket.public) {
    throw new Error(`Bucket ${FREE_MATERIALS_BUCKET} está público; deveria ser privado.`);
  }

  for (const material of COURSE_MATERIALS) {
    const localPath = resolve(sourceDir, `${material.id}.pdf`);
    const size = statSync(localPath).size;
    const { error } = await admin.storage
      .from(FREE_MATERIALS_BUCKET)
      .upload(material.filePath, readFileSync(localPath), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (error) throw new Error(`${material.id}: ${error.message}`);

    // Só as gratuitas fixam o tamanho no código; as exclusivas usam o do bucket.
    const sizeNote =
      material.sizeBytes === undefined || size === material.sizeBytes
        ? ""
        : ` (atualize sizeBytes: ${material.sizeBytes} → ${size})`;
    console.log(`✓ ${material.id} → ${material.filePath}${sizeNote}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
