#!/usr/bin/env node
/**
 * Seed do curso nas tabelas nativas (courses/modules/lessons) a partir de
 * src/data/course.yml + overlay de lesson_overrides (edições do painel). Depois
 * disto + COURSE_SOURCE=db, o DB é a fonte da verdade do conteúdo. Ver PRD
 * course-db-native.
 *
 * Uso:
 *   npm run db:seed                # DRY-RUN: mostra o plano, não escreve nada
 *   npm run db:seed -- --apply     # escreve no Supabase (service-role)
 *
 * Requer p/ --apply: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
 * Aplique a migração 014_course_native_runtime.sql ANTES. Idempotente (upsert por slug).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const COURSE_SLUG = "claude-cowork-advogados";

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/** course.yml → linhas mapeadas p/ o schema nativo (sort_order = posição). */
function buildPlan() {
  const raw = yaml.load(readFileSync(resolve(root, "src/data/course.yml"), "utf8"));
  const course = {
    slug: COURSE_SLUG,
    title: raw.title,
    subtitle: raw.subtitle,
    published: true,
    sort_order: 0,
  };
  const modules = raw.modules.map((m, i) => ({
    slug: m.id,
    title: m.title,
    description: m.description ?? null,
    thumbnail_gradient: m.thumbnailGradient ?? null,
    cover_image: m.coverImage ?? null,
    unlock_after_days: m.unlockAfterDays ?? 0,
    sort_order: i,
    published: true,
  }));
  const lessons = [];
  raw.modules.forEach((m) => {
    m.lessons.forEach((l, j) => {
      lessons.push({
        module_slug: m.id,
        slug: l.id,
        title: l.title,
        duration: l.duration ?? null,
        youtube_id: l.youtubeId ?? null,
        tella: l.tella ?? null,
        description: l.description ?? null,
        sort_order: j,
        published: true,
      });
    });
  });
  return { course, modules, lessons };
}

/** Dobra as edições do painel (lesson_overrides) no plano: campos, publicação,
 *  ordem, e aulas custom (sem par no catálogo). */
function applyOverrides(plan, overrides) {
  const byKey = new Map(overrides.map((o) => [`${o.module_id}:${o.lesson_id}`, o]));
  for (const l of plan.lessons) {
    const o = byKey.get(`${l.module_slug}:${l.slug}`);
    if (!o) continue;
    if (o.title != null) l.title = o.title;
    if (o.duration != null) l.duration = o.duration;
    if (o.description != null) l.description = o.description;
    if (o.youtube_id != null) l.youtube_id = o.youtube_id;
    if (o.tella != null) l.tella = o.tella;
    if (o.published != null) l.published = o.published;
    if (o.order_index != null) l.sort_order = o.order_index;
    byKey.delete(`${l.module_slug}:${l.slug}`);
  }
  // Restantes = aulas criadas no painel; só entram se o módulo existir no plano.
  for (const o of byKey.values()) {
    if (!plan.modules.some((m) => m.slug === o.module_id)) continue;
    plan.lessons.push({
      module_slug: o.module_id,
      slug: o.lesson_id,
      title: o.title ?? o.lesson_id,
      duration: o.duration ?? null,
      youtube_id: o.youtube_id ?? null,
      tella: o.tella ?? null,
      description: o.description ?? null,
      sort_order: o.order_index ?? 9999,
      published: o.published ?? true,
    });
  }
  return plan;
}

async function apply(plan) {
  loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local).",
    );
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: overrides, error: oErr } = await admin
    .from("lesson_overrides")
    .select("*");
  if (oErr) throw oErr;
  applyOverrides(plan, overrides ?? []);

  const { data: courseRow, error: cErr } = await admin
    .from("courses")
    .upsert(plan.course, { onConflict: "slug" })
    .select("id")
    .single();
  if (cErr) throw cErr;
  const courseId = courseRow.id;

  const moduleRows = plan.modules.map((m) => ({ ...m, course_id: courseId }));
  const { data: mods, error: mErr } = await admin
    .from("modules")
    .upsert(moduleRows, { onConflict: "course_id,slug" })
    .select("id, slug");
  if (mErr) throw mErr;
  const moduleIdBySlug = new Map(mods.map((m) => [m.slug, m.id]));

  const lessonRows = plan.lessons
    .map((l) => ({
      module_id: moduleIdBySlug.get(l.module_slug),
      slug: l.slug,
      title: l.title,
      duration: l.duration,
      youtube_id: l.youtube_id,
      tella: l.tella,
      description: l.description,
      sort_order: l.sort_order,
      published: l.published,
    }))
    .filter((r) => r.module_id);
  const { error: lErr } = await admin
    .from("lessons")
    .upsert(lessonRows, { onConflict: "module_id,slug" });
  if (lErr) throw lErr;

  console.log(
    `✓ Seed aplicado: 1 curso, ${moduleRows.length} módulos, ${lessonRows.length} aulas.`,
  );
}

const APPLY = process.argv.includes("--apply");
const plan = buildPlan();

if (!APPLY) {
  console.log(
    `DRY-RUN (use \`npm run db:seed -- --apply\` p/ escrever no Supabase).`,
  );
  console.log(
    `Curso "${plan.course.slug}": ${plan.modules.length} módulos, ${plan.lessons.length} aulas.`,
  );
  for (const m of plan.modules) {
    const n = plan.lessons.filter((l) => l.module_slug === m.slug).length;
    console.log(`  - ${m.slug} (${m.title}) · ${n} aulas`);
  }
  console.log(
    "Overrides do painel (lesson_overrides) são aplicados só no --apply (exige o DB).",
  );
  process.exit(0);
}

await apply(plan);
