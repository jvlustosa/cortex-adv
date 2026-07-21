import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Lock, Play } from "lucide-react";
import type { MergedCourse } from "@/components/members/course-area";
import { ModuleCover } from "@/components/aulas/module-cover";
import { getModuleCoverImage } from "@/lib/course/module-covers";
import { computeModuleAccess } from "@/lib/course/module-access";
import {
  findNextLesson,
  type NextLessonTarget,
} from "@/lib/course/progress";
import { formatUnlockDate } from "@/lib/course/packs-access";
import { LessonCard } from "./lesson-card";
import styles from "./lesson-cards-grid.module.css";

type LessonCardsGridProps = {
  course: MergedCourse;
  /** created_at do aluno (base da trava por tempo). null = sem data confiável. */
  enrolledAt?: string | null;
  /** Admin/demo: ignora a trava e libera tudo. */
  bypassLock?: boolean;
  /** Chaves "module_id:lesson_id" das aulas já assistidas. */
  completedKeys?: string[];
};

export function LessonCardsGrid({
  course,
  enrolledAt = null,
  bypassLock = false,
  completedKeys = [],
}: LessonCardsGridProps) {
  const completed = new Set(completedKeys);
  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );
  const doneTotal = completedKeys.length;
  const nextLesson: NextLessonTarget | null = findNextLesson(
    course,
    completedKeys,
  );
  const allDone = totalLessons > 0 && doneTotal >= totalLessons;

  return (
    <div>
      <header className={styles.pageIntro}>
        <p className={styles.eyebrow}>{course.subtitle}</p>
        <h1 className={styles.title}>{course.title}</h1>
        <p className={styles.subtitle}>
          Explore os módulos e escolha por onde começar. Ao clicar, você entra
          no módulo e assiste a aula.
        </p>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <Layers className="size-3.5" aria-hidden />
            {course.modules.length} módulos
          </span>
          <span className={styles.stat}>
            <BookOpen className="size-3.5" aria-hidden />
            {doneTotal}/{totalLessons} aulas
          </span>
        </div>

        {nextLesson ? (
          <Link href={nextLesson.href} className={styles.continueCta}>
            <span className={styles.continueIcon} aria-hidden>
              <Play className="size-4 fill-current" />
            </span>
            <span className={styles.continueText}>
              <span className={styles.continueLabel}>Continuar assistindo</span>
              <span className={styles.continueLesson}>
                {nextLesson.moduleTitle} · {nextLesson.lessonTitle}
              </span>
            </span>
            <ArrowRight className="size-4 opacity-80" aria-hidden />
          </Link>
        ) : allDone ? (
          <Link href="/certificado" className={styles.continueCta}>
            <span className={styles.continueText}>
              <span className={styles.continueLabel}>Curso concluído</span>
              <span className={styles.continueLesson}>
                Ver e baixar seu certificado
              </span>
            </span>
            <ArrowRight className="size-4 opacity-80" aria-hidden />
          </Link>
        ) : null}
      </header>

      {course.modules.map((mod, modIndex) => {
        const access = bypassLock
          ? { isUnlocked: true, unlockAt: null }
          : computeModuleAccess(enrolledAt, mod.unlockAfterDays);
        const unlockDate = formatUnlockDate(access.unlockAt);
        const doneInModule = mod.lessons.filter((l) =>
          completed.has(`${mod.id}:${l.id}`),
        ).length;

        return (
          <section key={mod.id} className={styles.moduleSection}>
            <div className={styles.moduleHero}>
              <ModuleCover
                src={getModuleCoverImage(mod.id, modIndex, mod.coverImage)}
                title={mod.title}
                seasonNumber={modIndex}
              />
              <div className={styles.moduleIntro}>
                <p className={styles.moduleDescription}>{mod.description}</p>
                <span className={styles.moduleCount}>
                  {doneInModule}/{mod.lessons.length} aulas
                  {doneInModule === mod.lessons.length && mod.lessons.length > 0
                    ? " · concluído"
                    : ""}
                </span>
              </div>
            </div>

            {access.isUnlocked ? (
              <div
                className={styles.carousel}
                role="region"
                aria-label={`Aulas de ${mod.title}`}
                tabIndex={0}
              >
                {mod.lessons.map((lesson, i) => (
                  <LessonCard
                    key={lesson.id}
                    module={mod}
                    lesson={lesson}
                    index={i}
                    moduleIndex={modIndex}
                    completed={completed.has(`${mod.id}:${lesson.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.lockNotice} role="status">
                <span className={styles.lockIcon}>
                  <Lock className="size-4" aria-hidden />
                </span>
                <p className={styles.lockText}>
                  {unlockDate
                    ? `Este módulo libera em ${unlockDate}.`
                    : "Este módulo ainda não está liberado."}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
