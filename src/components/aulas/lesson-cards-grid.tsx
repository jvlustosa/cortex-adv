import { BookOpen, Layers } from "lucide-react";
import type { MergedCourse } from "@/components/members/course-area";
import { LessonCard } from "./lesson-card";
import styles from "./lesson-cards-grid.module.css";

type LessonCardsGridProps = {
  course: MergedCourse;
};

export function LessonCardsGrid({ course }: LessonCardsGridProps) {
  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );
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
            {totalLessons} aulas
          </span>
        </div>
      </header>

      {course.modules.map((mod) => (
        <section key={mod.id} className={styles.moduleSection}>
          <div className={styles.moduleHeader}>
            <div>
              <h2 className={styles.moduleTitle}>{mod.title}</h2>
              <p className={styles.moduleDescription}>{mod.description}</p>
            </div>
            <span className={styles.moduleCount}>
              {mod.lessons.length} aulas
            </span>
          </div>

          <div className={styles.grid}>
            {mod.lessons.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                module={mod}
                lesson={lesson}
                index={i}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
