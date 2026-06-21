import Image from "next/image";
import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { getModuleCoverImage } from "@/lib/course/module-covers";
import type { CourseLesson, CourseModule } from "@/data/course-content";
import styles from "./lesson-card.module.css";

type LessonCardProps = {
  module: CourseModule;
  lesson: CourseLesson;
  index: number;
  moduleIndex: number;
};

export function LessonCard({
  module,
  lesson,
  index,
  moduleIndex,
}: LessonCardProps) {
  const href = `/aulas/${module.id}/${lesson.id}`;
  const coverSrc = getModuleCoverImage(module.id, moduleIndex, module.coverImage);
  const indexLabel = (index + 1).toString().padStart(2, "0");

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.visual}>
        <Image
          src={coverSrc}
          alt=""
          fill
          quality={92}
          sizes="(max-width: 480px) 34vw, 152px"
          className={styles.coverImage}
          aria-hidden
        />
        <div className={styles.visualOverlay} aria-hidden />
        <span className={styles.playBadge} aria-hidden>
          <Play className="size-4 fill-current" />
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.bodyHead}>
          <span className={styles.moduleTag}>{module.title}</span>
          <span className={styles.lessonIndex}>{indexLabel}</span>
        </div>
        <h3 className={styles.title}>{lesson.title}</h3>
        <p className={styles.description}>{lesson.description}</p>
        <div className={styles.bodyFooter}>
          <span className={styles.duration}>
            <Clock className="size-3" aria-hidden />
            {lesson.duration}
          </span>
          <span className={styles.cta}>Assistir aula →</span>
        </div>
      </div>
    </Link>
  );
}
