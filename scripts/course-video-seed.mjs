// Lê src/data/course.yml e gera supabase/seed-lesson-videos.sql: um upsert que
// preenche o vídeo (tella / youtube_id) de TODAS as aulas na tabela
// lesson_overrides. Rode `npm run course:video-seed` e cole o SQL no Supabase.
//
// Re-executável: só mexe nas colunas de vídeo + updated_at (não apaga
// published/title/duration/description que o admin tenha ajustado à mão).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const YAML_PATH = resolve(ROOT, "src/data/course.yml");
const OUT_PATH = resolve(ROOT, "supabase/seed-lesson-videos.sql");

/** Escapa string para literal SQL (aspas simples duplicadas). */
const sql = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlOrNull = (value) => (value ? sql(value) : "null");

const raw = yaml.load(readFileSync(YAML_PATH, "utf8"));
if (!raw || !Array.isArray(raw.modules)) {
  console.error("[course:video-seed] course.yml inválido.");
  process.exit(1);
}

const rows = [];
let skipped = 0;
for (const mod of raw.modules) {
  for (const lesson of mod.lessons ?? []) {
    // Só entra quem tem vídeo. Sem tella nem youtubeId não há o que preencher.
    if (!lesson.tella && !lesson.youtubeId) {
      skipped++;
      continue;
    }
    rows.push(
      `  (${sql(mod.id)}, ${sql(lesson.id)}, ${sqlOrNull(lesson.tella)}, ${sqlOrNull(lesson.youtubeId)}, now())`,
    );
  }
}

if (rows.length === 0) {
  console.error("[course:video-seed] nenhuma aula com vídeo no course.yml.");
  process.exit(1);
}

const output = `-- GERADO por scripts/course-video-seed.mjs — fonte: src/data/course.yml
-- Preenche o vídeo de todas as aulas em lesson_overrides (Supabase = fonte da verdade).
-- Requer a coluna tella (migration 012_lesson_tella.sql). Re-executável: só toca
-- tella/youtube_id + updated_at, preservando published/title/duration/description.

insert into public.lesson_overrides (module_id, lesson_id, tella, youtube_id, updated_at)
values
${rows.join(",\n")}
on conflict (module_id, lesson_id) do update set
  tella = excluded.tella,
  youtube_id = excluded.youtube_id,
  updated_at = now();
`;

writeFileSync(OUT_PATH, output);
console.log(
  `[course:video-seed] ✓ ${rows.length} aulas com vídeo → supabase/seed-lesson-videos.sql` +
    (skipped ? ` (${skipped} sem vídeo, ignoradas)` : ""),
);
