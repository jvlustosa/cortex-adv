#!/usr/bin/env node
/**
 * Gera supabase/migrations/006_seed_curso.sql
 * Uso: node scripts/generate-course-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CURSO_META, CURSO_NIVEIS } from "./curso-roteiro-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function sqlStr(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

const lines = [];

lines.push("-- Seed: curso Claude para Advogados");
lines.push("-- Gerado por: node scripts/generate-course-seed.mjs");
lines.push("");
lines.push("insert into public.courses (slug, title, tagline, description, published, sort_order)");
lines.push(
  `values (${sqlStr("claude-para-advogados")}, ${sqlStr(CURSO_META.title)}, ${sqlStr(CURSO_META.tagline)}, ${sqlStr(CURSO_META.tagline)}, true, 0)`,
);
lines.push("on conflict (slug) do update set");
lines.push("  title = excluded.title,");
lines.push("  tagline = excluded.tagline,");
lines.push("  description = excluded.description,");
lines.push("  updated_at = now();");
lines.push("");

CURSO_NIVEIS.forEach((nivel, moduleIndex) => {
  const levelKey = nivel.level === "bonus" ? "bonus" : String(nivel.level);
  const levelNum = nivel.level === "bonus" ? "null" : String(nivel.level);
  const published = nivel.id === "n0" ? "true" : "false";

  lines.push(`-- Módulo ${nivel.id}`);
  lines.push("insert into public.modules (course_id, slug, level_key, level_num, title, subtitle, sort_order, published)");
  lines.push("select c.id,");
  lines.push(`  ${sqlStr(nivel.id)},`);
  lines.push(`  ${sqlStr(levelKey)},`);
  lines.push(`  ${levelNum},`);
  lines.push(`  ${sqlStr(nivel.title)},`);
  lines.push(`  ${nivel.subtitle ? sqlStr(nivel.subtitle) : "null"},`);
  lines.push(`  ${moduleIndex},`);
  lines.push(`  ${published}`);
  lines.push("from public.courses c");
  lines.push("where c.slug = 'claude-para-advogados'");
  lines.push("on conflict (course_id, slug) do update set");
  lines.push("  title = excluded.title,");
  lines.push("  subtitle = excluded.subtitle,");
  lines.push("  sort_order = excluded.sort_order,");
  lines.push("  updated_at = now();");
  lines.push("");

  nivel.aulas.forEach((aula, lessonIndex) => {
    const isFree = aula.badge === "gratis";
    const publishedLesson = isFree ? "true" : "false";
    const badge = aula.badge ? `'${aula.badge}'::public.lesson_badge` : "null";

    lines.push("insert into public.lessons (module_id, slug, title, objective, duration_minutes, badge, sort_order, published, is_free_preview)");
    lines.push("select m.id,");
    lines.push(`  ${sqlStr(aula.id)},`);
    lines.push(`  ${sqlStr(aula.title)},`);
    lines.push(`  ${sqlStr(aula.objective)},`);
    lines.push(`  ${aula.minutes},`);
    lines.push(`  ${badge},`);
    lines.push(`  ${lessonIndex},`);
    lines.push(`  ${publishedLesson},`);
    lines.push(`  ${isFree}`);
    lines.push("from public.modules m");
    lines.push("join public.courses c on c.id = m.course_id");
    lines.push(`where c.slug = 'claude-para-advogados' and m.slug = ${sqlStr(nivel.id)}`);
    lines.push("on conflict (module_id, slug) do update set");
    lines.push("  title = excluded.title,");
    lines.push("  objective = excluded.objective,");
    lines.push("  duration_minutes = excluded.duration_minutes,");
    lines.push("  badge = excluded.badge,");
    lines.push("  sort_order = excluded.sort_order,");
    lines.push("  updated_at = now();");
    lines.push("");
  });
});

const out = join(root, "supabase/migrations/006_seed_curso.sql");
writeFileSync(out, `${lines.join("\n")}\n`);
const totalLessons = CURSO_NIVEIS.reduce((a, n) => a + n.aulas.length, 0);
console.log(`Wrote ${out} (${CURSO_NIVEIS.length} módulos, ${totalLessons} aulas)`);
