// Gera src/data/course-content.ts a partir de src/data/course.yml.
// A fonte da verdade é o YAML; este .ts é gerado (não edite à mão).
// Rodado manualmente via `npm run course:build` e automaticamente no `prebuild`.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const YAML_PATH = resolve(ROOT, "src/data/course.yml");
const OUT_PATH = resolve(ROOT, "src/data/course-content.ts");

/** Aborta a geração com mensagem clara (falha o build, sem emitir lixo). */
function fail(message) {
  console.error(`\n[course:build] ${message}\n`);
  process.exit(1);
}

const raw = yaml.load(readFileSync(YAML_PATH, "utf8"));

// ── Validação: barra conteúdo malformado antes de gerar o .ts ──────────────
if (!raw || typeof raw !== "object") fail("course.yml vazio ou inválido.");
if (typeof raw.title !== "string" || typeof raw.subtitle !== "string") {
  fail("course.yml precisa de `title` e `subtitle` (strings).");
}
if (!Array.isArray(raw.modules) || raw.modules.length === 0) {
  fail("course.yml precisa de ao menos um módulo em `modules`.");
}

const seenLessonKeys = new Set();
for (const mod of raw.modules) {
  for (const field of ["id", "title", "description", "thumbnailGradient"]) {
    if (typeof mod?.[field] !== "string" || !mod[field]) {
      fail(`Módulo "${mod?.id ?? "?"}" sem campo obrigatório \`${field}\`.`);
    }
  }
  if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) {
    fail(`Módulo "${mod.id}" precisa de ao menos uma aula.`);
  }
  for (const lesson of mod.lessons) {
    for (const field of ["id", "title", "duration"]) {
      if (typeof lesson?.[field] !== "string" || !lesson[field]) {
        fail(
          `Aula "${lesson?.id ?? "?"}" (módulo "${mod.id}") sem \`${field}\`.`,
        );
      }
    }
    const key = `${mod.id}:${lesson.id}`;
    if (seenLessonKeys.has(key)) fail(`Aula duplicada: ${key}.`);
    seenLessonKeys.add(key);
  }
}

// ── Serialização em TS nativo (chaves sem aspas, valores escapados) ─────────
const q = (value) => JSON.stringify(value); // aspas duplas + escaping correto

function emitLesson(lesson, indent) {
  const p = "  ".repeat(indent);
  const p2 = "  ".repeat(indent + 1);
  const lines = [`${p2}id: ${q(lesson.id)},`, `${p2}title: ${q(lesson.title)},`];
  if (lesson.youtubeId) lines.push(`${p2}youtubeId: ${q(lesson.youtubeId)},`);
  if (lesson.tella) lines.push(`${p2}tella: ${q(lesson.tella)},`);
  lines.push(`${p2}duration: ${q(lesson.duration)},`);
  if (lesson.description) {
    lines.push(`${p2}description: ${q(lesson.description)},`);
  }
  return `${p}{\n${lines.join("\n")}\n${p}},`;
}

function emitModule(mod, indent) {
  const p = "  ".repeat(indent);
  const p2 = "  ".repeat(indent + 1);
  const lines = [
    `${p2}id: ${q(mod.id)},`,
    `${p2}title: ${q(mod.title)},`,
    `${p2}description: ${q(mod.description)},`,
    `${p2}thumbnailGradient: ${q(mod.thumbnailGradient)},`,
  ];
  if (mod.coverImage) lines.push(`${p2}coverImage: ${q(mod.coverImage)},`);
  const lessons = mod.lessons.map((l) => emitLesson(l, indent + 2)).join("\n");
  lines.push(`${p2}lessons: [\n${lessons}\n${p2}],`);
  return `${p}{\n${lines.join("\n")}\n${p}},`;
}

const modulesTs = raw.modules.map((m) => emitModule(m, 2)).join("\n");

const output = `// GENERATED — não edite à mão. Fonte da verdade: src/data/course.yml
// Rode \`npm run course:build\` após editar o YAML (o \`prebuild\` também roda).

export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  /** ID do vídeo YouTube (embed). Omitir = placeholder */
  youtubeId?: string;
  /** Slug público do vídeo no Tella (último trecho de tella.tv/video/<slug>). Tem prioridade sobre youtubeId. */
  tella?: string;
  description: string;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  /** Gradiente CSS fallback quando não há capa */
  thumbnailGradient: string;
  /** Capa 3:4 da temporada (opcional; senão usa índice do módulo) */
  coverImage?: string;
  lessons: CourseLesson[];
};

export type Course = {
  title: string;
  subtitle: string;
  modules: CourseModule[];
};

export const COURSE: Course = {
  title: ${q(raw.title)},
  subtitle: ${q(raw.subtitle)},
  modules: [
${modulesTs}
  ],
};

export function findLesson(moduleId: string, lessonId: string) {
  const mod = COURSE.modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return { module: mod, lesson };
}
`;

writeFileSync(OUT_PATH, output);

const lessonCount = raw.modules.reduce((n, m) => n + m.lessons.length, 0);
console.log(
  `[course:build] ✓ ${raw.modules.length} módulos, ${lessonCount} aulas → src/data/course-content.ts`,
);
