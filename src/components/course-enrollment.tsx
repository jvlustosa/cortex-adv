import Link from "next/link";
import { Suspense } from "react";
import { ClaudeAcademyWaitlist } from "@/components/claude-academy-invite-hero";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { COURSE_MENTOR, OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";
import styles from "./course-enrollment.module.css";

export function CourseEnrollment() {
  return (
    <section
      id="lista-espera"
      className={styles.section}
      aria-labelledby="course-enrollment-heading"
    >
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>Lista de espera</p>
        <h2 id="course-enrollment-heading" className={styles.title}>
          Garanta sua vaga
        </h2>
        <p className={styles.subtitle}>
          Viu o investimento? Entre na fila. Avisamos no WhatsApp quando as
          inscrições abrirem. Mentoria com{" "}
          <strong className="text-[var(--foreground)]">
            {COURSE_MENTOR.name}
          </strong>
          .
        </p>

        <div className={styles.form}>
          <Suspense
            fallback={
              <div
                className="mx-auto h-56 w-full animate-pulse rounded-2xl bg-[var(--surface)]"
                aria-hidden
              />
            }
          >
            <ClaudeAcademyWaitlist compact />
          </Suspense>
        </div>

        <div className={styles.links}>
          <a
            href={OPEN_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            <WhatsAppIcon className="size-3.5" />
            Grupo aberto
          </a>
          <span className={styles.linksSep} aria-hidden>
            ·
          </span>
          <Link href="/login">Comunidade VIP</Link>
          <span className={styles.linksSep} aria-hidden>
            ·
          </span>
          <Link href="/curso">Ver programa completo</Link>
        </div>
      </div>
    </section>
  );
}
