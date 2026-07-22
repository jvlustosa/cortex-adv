"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Download, PlayCircle } from "lucide-react";
import type { CourseLesson, CourseModule } from "@/data/course-content";
import type { ComingSoonModuleView } from "@/lib/lessons/db-course";
import type { LessonMaterial } from "@/lib/lessons/materials";
import { CourseMenu } from "./course-menu";
import { CompleteLessonButton } from "./complete-lesson-button";
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
  /** Módulos "em breve" (DB). Vazio/ausente → o grid cai no roteiro público. */
  comingSoonModules?: ComingSoonModuleView[];
};

type CourseAreaProps = {
  course: MergedCourse;
  demoMode?: boolean;
  moduleId: string;
  lessonId: string;
  completedKeys: string[];
  totalLessons: number;
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
  return { moduleId: mod?.id ?? "", lessonId: lesson?.id ?? "" };
}

export function CourseArea({
  course,
  demoMode,
  moduleId: moduleIdProp,
  lessonId: lessonIdProp,
  completedKeys = [],
  totalLessons = 0,
}: CourseAreaProps) {
  const router = useRouter();

  const [moduleId, setModuleId] = useState(moduleIdProp);
  const [lessonId, setLessonId] = useState(lessonIdProp);
  const [materials, setMaterials] = useState<{
    key: string;
    items: LessonMaterial[];
  }>({ key: "", items: [] });

  // Ressincroniza estado local quando a navegação externa muda as props da URL
  // (voltar/avançar do navegador). Ajuste durante o render — padrão oficial do
  // React para derivar estado de props sem useEffect e sem flash de tela.
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

  // Conjunto de concluídas: otimista no client, re-semeado quando o servidor
  // manda novas chaves (a cada navegação a página recarrega o progresso real).
  const completedKeysStr = completedKeys.join("|");
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(completedKeys),
  );
  const [seenCompleted, setSeenCompleted] = useState(completedKeysStr);
  if (seenCompleted !== completedKeysStr) {
    setSeenCompleted(completedKeysStr);
    setCompleted(new Set(completedKeys));
  }

  const activeModule = course.modules.find((m) => m.id === moduleId)!;
  const activeLesson =
    activeModule.lessons.find((l) => l.id === lessonId) ??
    activeModule.lessons[0];

  const currentKey = `${activeModule.id}:${activeLesson.id}`;
  const isCurrentCompleted = completed.has(currentKey);

  const flat = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ moduleId: m.id, lessonId: l.id })),
  );
  const currentIndex = flat.findIndex(
    (f) => f.moduleId === activeModule.id && f.lessonId === activeLesson.id,
  );
  const nextTarget =
    currentIndex >= 0 && currentIndex < flat.length - 1
      ? flat[currentIndex + 1]
      : null;

  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completed.size / totalLessons) * 100))
      : 0;

  const lessonMaterials =
    materials.key === currentKey ? materials.items : [];

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

  const topRef = useRef<HTMLDivElement>(null);

  const selectLesson = useCallback(
    (mod: string, lesson: string) => {
      setModuleId(mod);
      setLessonId(lesson);
      syncUrl(mod, lesson);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [syncUrl],
  );

  const persist = useCallback(
    async (method: "POST" | "DELETE", mod: string, lesson: string) => {
      if (demoMode) return;
      try {
        await fetch("/api/lessons/complete", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId: mod, lessonId: lesson }),
        });
      } catch {
        // UI já atualizou otimista; a próxima navegação reconcilia com o servidor.
      }
    },
    [demoMode],
  );

  const completeAndAdvance = useCallback(async () => {
    setCompleted((prev) => new Set(prev).add(currentKey));
    await persist("POST", activeModule.id, activeLesson.id);
    if (nextTarget) selectLesson(nextTarget.moduleId, nextTarget.lessonId);
  }, [currentKey, persist, activeModule.id, activeLesson.id, nextTarget, selectLesson]);

  const undoComplete = useCallback(async () => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(currentKey);
      return next;
    });
    await persist("DELETE", activeModule.id, activeLesson.id);
  }, [currentKey, persist, activeModule.id, activeLesson.id]);

  const goNext = useCallback(() => {
    if (nextTarget) selectLesson(nextTarget.moduleId, nextTarget.lessonId);
  }, [nextTarget, selectLesson]);

  return (
    <div className={styles.layout} ref={topRef}>
      <section className={styles.main} aria-label="Conteúdo da aula">
        <div className={styles.topbar}>
          <Link href="/area-de-membros" className={styles.backLink}>
            <ArrowLeft className="size-4" aria-hidden />
            Área de membros
          </Link>
          <div className={styles.progress} aria-label="Progresso do curso">
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {completed.size}/{totalLessons} · {progressPercent}%
            </span>
          </div>
        </div>

        <div className={styles.playerWrap}>
          {activeLesson.tella ? (
            <iframe
              key={activeLesson.id}
              className={styles.playerIframe}
              src={`https://www.tella.tv/video/${activeLesson.tella}/embed?b=0&title=0&a=0`}
              title={activeLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : activeLesson.youtubeId ? (
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
                Vídeo desta aula em produção. Use o menu ao lado para explorar a
                estrutura do curso.
              </p>
            </div>
          )}
        </div>

        <article className={styles.lessonDetail}>
          <div className={styles.lessonHead}>
            <div>
              <p className={styles.lessonModuleLabel}>{activeModule.title}</p>
              <h1 className={styles.lessonTitle}>{activeLesson.title}</h1>
            </div>
            <span className={styles.lessonDuration}>
              <Clock className="size-3.5" aria-hidden />
              {activeLesson.duration}
            </span>
          </div>

          <p className={styles.lessonDescription}>{activeLesson.description}</p>

          <CompleteLessonButton
            isCompleted={isCurrentCompleted}
            hasNext={!!nextTarget}
            disabled={demoMode}
            onCompleteAndAdvance={completeAndAdvance}
            onGoNext={goNext}
            onUndo={undoComplete}
          />

          {lessonMaterials.length > 0 ? (
            <section className={styles.materials}>
              <h2 className={styles.materialsTitle}>Materiais da aula</h2>
              <ul className={styles.materialsList}>
                {lessonMaterials.map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={m.fileName}
                      aria-disabled={m.url ? undefined : true}
                      className={styles.materialItem}
                    >
                      <Download className={styles.materialIcon} aria-hidden />
                      <span className={styles.materialLabel}>{m.label}</span>
                      {m.sizeBytes ? (
                        <span className={styles.materialSize}>
                          {formatBytes(m.sizeBytes)}
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <details className={styles.feedback}>
            <summary className={styles.feedbackSummary}>
              Como foi esta aula?
            </summary>
            <div className={styles.feedbackBody}>
              <LessonFeedbackForm
                moduleId={moduleId}
                lessonId={lessonId}
                disabled={demoMode}
              />
            </div>
          </details>
        </article>
      </section>

      <aside className={styles.menuCol}>
        <CourseMenu
          course={course}
          activeModuleId={activeModule.id}
          activeLessonId={activeLesson.id}
          completed={completed}
          onSelectLesson={selectLesson}
        />
      </aside>
    </div>
  );
}
