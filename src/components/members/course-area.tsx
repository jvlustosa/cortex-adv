"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, PlayCircle } from "lucide-react";
import { CLAUDE_ACADEMY_LOGO } from "@/components/claude-academy-brand";
import type { CourseLesson, CourseModule } from "@/data/course-content";
import { LessonFeedbackForm } from "./lesson-feedback-form";
import styles from "./course-area.module.css";

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
                <div
                  className={styles.thumb}
                  style={{ background: mod.thumbnailGradient }}
                >
                  <Image
                    src={CLAUDE_ACADEMY_LOGO}
                    alt=""
                    width={28}
                    height={28}
                    className={styles.thumbLogo}
                    aria-hidden
                  />
                  <span className={styles.thumbIndex}>
                    M{(i + 1).toString().padStart(2, "0")}
                  </span>
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
