import Image from "next/image";
import { BookOpen, Clock, Layers } from "lucide-react";
import { COURSE } from "@/data/course-content";
import { getModuleCoverImage } from "@/lib/course/module-covers";
import styles from "./course-roadmap.module.css";

function totalDurationMinutes() {
  return COURSE.modules.reduce(
    (sum, mod) =>
      sum +
      mod.lessons.reduce((lessonSum, lesson) => {
        const match = lesson.duration.match(/(\d+)/);
        return lessonSum + (match ? Number(match[1]) : 0);
      }, 0),
    0,
  );
}

export function CourseRoadmap() {
  const totalLessons = COURSE.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );
  const totalMinutes = totalDurationMinutes();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <section className={styles.section} aria-labelledby="roadmap-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Trilha do curso</p>
          <h2 id="roadmap-heading" className={styles.title}>
            O que você vai aprender
          </h2>
          <p className={styles.subtitle}>
            {COURSE.subtitle}. Módulos curtos, direto ao ponto, pra aplicar no
            escritório ainda esta semana.
          </p>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <Layers className="size-3.5" aria-hidden />
              {COURSE.modules.length} módulos
            </span>
            <span className={styles.stat}>
              <BookOpen className="size-3.5" aria-hidden />
              {totalLessons} aulas
            </span>
            <span className={styles.stat}>
              <Clock className="size-3.5" aria-hidden />
              {hours > 0 ? `${hours}h` : ""}
              {minutes > 0 ? `${hours > 0 ? " " : ""}${minutes} min` : ""} de
              conteúdo
            </span>
          </div>
        </header>

        <ol className={styles.timeline}>
          {COURSE.modules.map((mod, index) => (
            <li key={mod.id} className={styles.module}>
              <span className={styles.marker} aria-hidden>
                {index + 1}
              </span>
              <article className={styles.moduleCard}>
                <div className={styles.moduleHead}>
                  <div className={styles.cover}>
                    <Image
                      src={getModuleCoverImage(mod.id, index, mod.coverImage)}
                      alt=""
                      fill
                      quality={90}
                      sizes="(max-width: 639px) 5rem, 6.5rem"
                      className={styles.coverImage}
                    />
                  </div>
                  <div className={styles.moduleHeadText}>
                    <h3 className={styles.moduleTitle}>{mod.title}</h3>
                    <p className={styles.moduleDescription}>
                      {mod.description}
                    </p>
                  </div>
                </div>
                <ul className={styles.lessonList}>
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className={styles.lesson}>
                      <span className={styles.lessonDot} aria-hidden />
                      <span>{lesson.title}</span>
                      <span className={styles.lessonMeta}>
                        {lesson.duration}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
