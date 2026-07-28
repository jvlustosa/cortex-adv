import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { ClaudeAcademyWaitlist } from "@/components/claude-academy-invite-hero";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { SALES_MODE } from "@/lib/launch-window";
import { COURSE_MENTOR, OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";
import styles from "./course-enrollment.module.css";

const isEvergreen = SALES_MODE === "evergreen";

/**
 * Fecho da landing. Em modo turma é a captação da fila de espera; no perpétuo
 * não existe fila pra entrar (a matrícula está aberta), então vira o CTA final
 * — comprar agora, ou grupo aberto pra quem ainda não vai comprar. O id
 * `lista-espera` fica nos dois modos: é âncora de links já publicados.
 */
export function CourseEnrollment() {
  return (
    <section
      id="lista-espera"
      className={styles.section}
      aria-labelledby="course-enrollment-heading"
    >
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>
          {isEvergreen ? "Matrícula aberta" : "Lista de espera"}
        </p>
        <h2 id="course-enrollment-heading" className={styles.title}>
          {isEvergreen ? "Pronto pra começar?" : "Garanta sua vaga"}
        </h2>
        <p className={styles.subtitle}>
          {isEvergreen ? (
            <>
              Assim que o pagamento confirma, você entra e já assiste a
              primeira aula. Mentoria com{" "}
              <strong className="text-[var(--foreground)]">
                {COURSE_MENTOR.name}
              </strong>{" "}
              e 8 dias pra testar sem risco.
            </>
          ) : (
            <>
              Viu o investimento? Entre na fila. Avisamos no WhatsApp quando as
              inscrições abrirem. Mentoria com{" "}
              <strong className="text-[var(--foreground)]">
                {COURSE_MENTOR.name}
              </strong>
              .
            </>
          )}
        </p>

        {isEvergreen ? (
          <div className={styles.ctaRow}>
            <a href="#precos" className={styles.ctaPrimary}>
              Fazer minha matrícula
              <ArrowRight className="size-4 opacity-80" aria-hidden />
            </a>
            <a
              href={OPEN_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              <WhatsAppIcon className="size-4" />
              Ainda não. Quero o grupo aberto
            </a>
          </div>
        ) : (
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
        )}

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
