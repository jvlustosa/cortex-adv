import Image from "next/image";
import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { CLAUDE_ACADEMY_LOGO } from "@/components/claude-academy-brand";
import type { CourseLesson, CourseModule } from "@/data/course-content";
import styles from "./lesson-card.module.css";

type LessonCardProps = {
  module: CourseModule;
  lesson: CourseLesson;
  index: number;
};

export function LessonCard({ module, lesson, index }: LessonCardProps) {
  const href = `/aulas/${module.id}/${lesson.id}`;

  return (
    <Link href={href} className={styles.card}>
      <div
        className={styles.visual}
        style={{ background: module.thumbnailGradient }}
      >
        <Image
          src={CLAUDE_ACADEMY_LOGO}
          alt=""
          width={44}
          height={44}
          className={styles.thumbLogo}
          aria-hidden
        />

        <div className={styles.visualTop}>
          <span className={styles.moduleTag}>{module.title}</span>
          <span className={styles.lessonIndex}>
            {(index + 1).toString().padStart(2, "0")}
          </span>
        </div>

        <div className={styles.visualBottom}>
          <span className={styles.duration}>
            <Clock className="size-3" aria-hidden />
            {lesson.duration}
          </span>
          <span className={styles.playBadge} aria-hidden>
            <Play className="size-4 fill-current" />
          </span>
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{lesson.title}</h3>
        <p className={styles.description}>{lesson.description}</p>
        <span className={styles.footer}>Assistir aula →</span>
      </div>
    </Link>
  );
}
