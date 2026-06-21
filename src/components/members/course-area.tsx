"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Download, PlayCircle } from "lucide-react";
import { ModuleCover } from "@/components/aulas/module-cover";
import { getModuleCoverImage } from "@/lib/course/module-covers";
import type { CourseLesson, CourseModule } from "@/data/course-content";
import type { LessonMaterial } from "@/lib/lessons/materials";
import { LessonFeedbackForm } from "./lesson-feedback-form";
import styles from "./course-area.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export type MergedCourse = {
  title: string;
  subtitle: string;
  modules: (CourseModule & {
    lessons: (CourseLesson & { published: boolean })[];
  })[];
};

type CourseAreaProps = {
  course: MergedCourse;
  userEmail?: string | null;
  demoMode?: boolean;
  moduleId: string;
  lessonId: string;
};

function pickInitial(
  course: MergedCourse,
  modParam: string | null,
  lessonParam: string | null,
): { moduleId: string; lessonId: string } {
  const mod =
    course.modules.find((m) => m.id === modParam) ?? course.modules[0];
  const lesson =
    mod?.lessons.find((l) => l.id === lessonParam) ?? mod?.lessons[0];
  return { moduleId: mod!.id, lessonId: lesson!.id };
}

export function CourseArea({
  course,
  userEmail,
  demoMode,
  moduleId: moduleIdProp,
  lessonId: lessonIdProp,
}: CourseAreaProps) {
  const router = useRouter();
  const lastViewKey = useRef<string | null>(null);

  const [moduleId, setModuleId] = useState(moduleIdProp);
  const [lessonId, setLessonId] = useState(lessonIdProp);
  const [materials, setMaterials] = useState<{
    key: string;
    items: LessonMaterial[];
  }>({ key: "", items: [] });

  // Ressincroniza o estado local quando a navegação externa muda as props da URL
  // (ex.: voltar/avançar do navegador). Ajuste durante o render — padrão oficial
  // do React para derivar estado de props sem useEffect e sem flash de tela.
  const [syncedFrom, setSyncedFrom] = useState({ moduleIdProp, lessonIdProp });
  if (
    syncedFrom.moduleIdProp !== moduleIdProp ||
    syncedFrom.lessonIdProp !== lessonIdProp
  ) {
    setSyncedFrom({ moduleIdProp, lessonIdProp });
    const next = pickInitial(course, moduleIdProp, lessonIdProp);
    setModuleId(next.moduleId);
    setLessonId(next.lessonId);
  }

  const activeModule = course.modules.find((m) => m.id === moduleId)!;
  const activeLesson =
    activeModule.lessons.find((l) => l.id === lessonId) ??
    activeModule.lessons[0];

  const lessonMaterials =
    materials.key === `${moduleId}:${lessonId}` ? materials.items : [];

  useEffect(() => {
    const key = `${moduleId}:${lessonId}`;
    if (lastViewKey.current === key) return;
    lastViewKey.current = key;

    void fetch("/api/lessons/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, lessonId }),
    });
  }, [moduleId, lessonId]);

  // Materiais da aula (skills, PDFs). Guardamos com a chave da aula para não
  // exibir material de outra aula enquanto o fetch novo não chega. Vazio em modo
  // demo ou sem service role (a API devolve []).
  useEffect(() => {
    if (demoMode) return;
    const key = `${moduleId}:${lessonId}`;
    let active = true;
    void fetch(
      `/api/lessons/materials?moduleId=${encodeURIComponent(moduleId)}&lessonId=${encodeURIComponent(lessonId)}`,
    )
      .then((r) => (r.ok ? r.json() : { materials: [] }))
      .then((d) => {
        if (active)
          setMaterials({ key, items: (d.materials ?? []) as LessonMaterial[] });
      })
      .catch(() => {
        if (active) setMaterials({ key, items: [] });
      });
    return () => {
      active = false;
    };
  }, [moduleId, lessonId, demoMode]);

  const syncUrl = useCallback(
    (mod: string, lesson: string) => {
      router.replace(`/aulas/${mod}/${lesson}`, { scroll: false });
    },
    [router],
  );

  function selectModule(mod: CourseModule) {
    const first = mod.lessons[0];
    if (!first) return;
    setModuleId(mod.id);
    setLessonId(first.id);
    syncUrl(mod.id, first.id);
  }

  function selectLesson(mod: CourseModule, lesson: CourseLesson) {
    setModuleId(mod.id);
    setLessonId(lesson.id);
    syncUrl(mod.id, lesson.id);
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.hero}>
          <p className={styles.heroEyebrow}>{course.subtitle}</p>
          <h1 className={styles.heroTitle}>{course.title}</h1>
          {userEmail ? (
            <p className={styles.heroUser}>{userEmail}</p>
          ) : demoMode ? (
            <p className={styles.heroUser}>Modo demo: login em breve</p>
          ) : null}
        </div>

        <div className={styles.moduleGrid} aria-label="Módulos do curso">
          {course.modules.map((mod, i) => {
            const isActive = mod.id === moduleId;
            return (
              <button
                key={mod.id}
                type="button"
                className={`${styles.moduleCard} ${isActive ? styles.moduleCardActive : ""}`}
                onClick={() => selectModule(mod)}
                aria-current={isActive ? "true" : undefined}
              >
                <div className={styles.thumb}>
                  <ModuleCover
                    src={getModuleCoverImage(mod.id, i, mod.coverImage)}
                    title={mod.title}
                    seasonNumber={i}
                    variant="thumb"
                  />
                </div>
                <div className={styles.moduleMeta}>
                  <span className={styles.moduleTitle}>{mod.title}</span>
                  <span className={styles.moduleCount}>
                    {mod.lessons.length} aulas
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.lessonPanel}>
          <div className={styles.lessonPanelHead}>
            Aulas · {activeModule.title}
          </div>
          <div className={styles.lessonList} aria-label={`Aulas de ${activeModule.title}`}>
            {activeModule.lessons.map((lesson, i) => {
              const isActive = lesson.id === activeLesson.id;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`${styles.lessonItem} ${isActive ? styles.lessonItemActive : ""}`}
                  onClick={() => selectLesson(activeModule, lesson)}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className={styles.lessonIndex}>
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span>
                    <span className={styles.lessonItemTitle}>{lesson.title}</span>
                    <p className={styles.lessonItemDuration}>{lesson.duration}</p>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className={styles.main} aria-label="Conteúdo da aula">
        <div className={styles.playerWrap}>
          {activeLesson.youtubeId ? (
            <iframe
              key={activeLesson.id}
              className={styles.playerIframe}
              src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeId}?rel=0`}
              title={activeLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className={styles.playerPlaceholder}>
              <div className={styles.playerPlaceholderIcon}>
                <PlayCircle className="size-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className={styles.playerPlaceholderText}>
                Vídeo desta aula em produção. Selecione outras aulas ou módulos
                para explorar a estrutura do curso.
              </p>
            </div>
          )}
        </div>

        <article className={styles.lessonDetail}>
          <p className={styles.lessonModuleLabel}>{activeModule.title}</p>
          <h2 className={styles.lessonTitle}>{activeLesson.title}</h2>
          <p className={styles.lessonDescription}>{activeLesson.description}</p>
          <span className={styles.lessonDuration}>
            <Clock className="size-3.5" aria-hidden />
            {activeLesson.duration}
          </span>

          {lessonMaterials.length > 0 ? (
            <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Materiais da aula
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {lessonMaterials.map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={m.fileName}
                      aria-disabled={m.url ? undefined : true}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-raised)]"
                    >
                      <Download
                        className="size-4 shrink-0 text-[var(--accent)]"
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{m.label}</span>
                      {m.sizeBytes ? (
                        <span className="shrink-0 text-xs text-[var(--muted)]">
                          {formatBytes(m.sizeBytes)}
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <LessonFeedbackForm
            moduleId={moduleId}
            lessonId={lessonId}
            disabled={demoMode}
          />
        </article>
      </section>
    </div>
  );
}
