import Image from "next/image";
import { BookOpen, Check, Clock, Layers, Plus } from "lucide-react";
import { COURSE } from "@/data/course-content";
import { COURSE_SCOPE } from "@/data/curso-trilha-public";
import { getModuleCoverImage } from "@/lib/course/module-covers";
import styles from "./course-roadmap.module.css";

export function CourseRoadmap() {
  const upcomingModules = COURSE_SCOPE.modules - COURSE.modules.length;

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
              {COURSE_SCOPE.modules} módulos
            </span>
            <span className={styles.stat}>
              <BookOpen className="size-3.5" aria-hidden />
              {COURSE_SCOPE.lessons} aulas
            </span>
            <span className={styles.stat}>
              <Clock className="size-3.5" aria-hidden />
              liberadas aos poucos
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
                    <span className={styles.moduleBadge}>
                      <Check className="size-3" aria-hidden />
                      Disponível
                    </span>
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
          {upcomingModules > 0 ? (
            <li className={styles.module}>
              <span
                className={`${styles.marker} ${styles.markerUpcoming}`}
                aria-hidden
              >
                <Plus className="size-4" />
              </span>
              <article
                className={`${styles.moduleCard} ${styles.moduleUpcoming}`}
              >
                <h3 className={styles.moduleTitle}>
                  Mais {upcomingModules} módulos a caminho
                </h3>
                <p className={styles.moduleDescription}>
                  A trilha completa tem {COURSE_SCOPE.modules} módulos e{" "}
                  {COURSE_SCOPE.lessons} aulas, liberados aos poucos e inclusos
                  sem pagar de novo. Você começa pelos que já estão no ar e
                  destrava o resto conforme sai.
                </p>
              </article>
            </li>
          ) : null}
        </ol>
      </div>
    </section>
  );
}
