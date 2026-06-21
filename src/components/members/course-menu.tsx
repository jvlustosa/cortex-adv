"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { MergedCourse } from "./course-area";
import styles from "./course-area.module.css";

type CourseMenuProps = {
  course: MergedCourse;
  activeModuleId: string;
  activeLessonId: string;
  completed: Set<string>;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
};

export function CourseMenu({
  course,
  activeModuleId,
  activeLessonId,
  completed,
  onSelectLesson,
}: CourseMenuProps) {
  // Só o módulo atual abre por padrão; os outros ficam colapsados (foco).
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([activeModuleId]),
  );
  const [seenActive, setSeenActive] = useState(activeModuleId);
  if (seenActive !== activeModuleId) {
    setSeenActive(activeModuleId);
    setExpanded((prev) => new Set(prev).add(activeModuleId));
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav className={styles.menu} aria-label="Conteúdo do curso">
      <p className={styles.menuTitle}>Conteúdo do curso</p>

      <div className={styles.menuModules}>
        {course.modules.map((mod, i) => {
          const isOpen = expanded.has(mod.id);
          const total = mod.lessons.length;
          const done = mod.lessons.filter((l) =>
            completed.has(`${mod.id}:${l.id}`),
          ).length;
          const isActiveModule = mod.id === activeModuleId;

          return (
            <div key={mod.id} className={styles.menuModule}>
              <button
                type="button"
                className={`${styles.menuModuleHead} ${isActiveModule ? styles.menuModuleHeadActive : ""}`}
                aria-expanded={isOpen}
                onClick={() => toggle(mod.id)}
              >
                <span className={styles.menuModuleMeta}>
                  <span className={styles.menuModuleEyebrow}>
                    Módulo {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className={styles.menuModuleTitle}>{mod.title}</span>
                </span>
                <span className={styles.menuModuleCount}>
                  {done}/{total}
                </span>
                <ChevronDown
                  className={`${styles.menuChevron} ${isOpen ? styles.menuChevronOpen : ""}`}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <ul className={styles.menuLessons}>
                  {mod.lessons.map((lesson, j) => {
                    const key = `${mod.id}:${lesson.id}`;
                    const isDone = completed.has(key);
                    const isActive =
                      isActiveModule && lesson.id === activeLessonId;

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          className={`${styles.menuLesson} ${isActive ? styles.menuLessonActive : ""}`}
                          aria-current={isActive ? "true" : undefined}
                          onClick={() => onSelectLesson(mod.id, lesson.id)}
                        >
                          <span
                            className={`${styles.menuLessonMark} ${isDone ? styles.menuLessonMarkDone : ""}`}
                            aria-hidden
                          >
                            {isDone ? (
                              <Check className="size-3" strokeWidth={3} />
                            ) : (
                              (j + 1).toString().padStart(2, "0")
                            )}
                          </span>
                          <span className={styles.menuLessonBody}>
                            <span className={styles.menuLessonTitle}>
                              {lesson.title}
                            </span>
                            <span className={styles.menuLessonDuration}>
                              {lesson.duration}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
