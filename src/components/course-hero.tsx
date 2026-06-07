import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClaudePixelLogo } from "@/components/claude-pixel-logo";
import { COURSE } from "@/data/course-content";
import { COURSE_MENTOR } from "@/lib/site";
import styles from "./course-hero.module.css";

const HIGHLIGHTS = [
  "Trilha completa: do primeiro prompt à automação do escritório",
  "Grupo aberto grátis no WhatsApp: conheça antes de comprar",
  "Comunidade VIP de alunos: suporte às aulas na matrícula",
] as const;

export function CourseHero() {
  const lessonCount = COURSE.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0,
  );

  return (
    <section className={styles.section} aria-labelledby="course-hero-heading">
      <div className={styles.glow} aria-hidden />

      <div className={styles.wrap}>
        <div className={styles.intro}>
          <div className={styles.copy}>
            <h1 id="course-hero-heading" className={styles.title}>
              {COURSE.title}
            </h1>
            <p className={styles.lead}>
              {COURSE.subtitle}. O curso completo do Chat Jurídico para dominar
              o Claude Cowork na bancada — peças, automação e uso ético, sem
              programar. Inclui Comunidade VIP e mentoria com{" "}
              <strong className="text-[var(--foreground)]">
                {COURSE_MENTOR.name}
              </strong>
              . O grupo aberto no WhatsApp continua gratuito para quem quiser
              conhecer primeiro.
            </p>

            <div className={styles.stats}>
              <span className={styles.stat}>
                <strong>{COURSE.modules.length}</strong> módulos
              </span>
              <span className={styles.stat}>
                <strong>{lessonCount}</strong> aulas
              </span>
              <span className={styles.stat}>
                <strong>Grupo</strong> aberto
              </span>
              <span className={styles.stat}>
                <strong>VIP</strong> alunos
              </span>
            </div>

            <ul className={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <li key={item} className={styles.highlight}>
                  <span className={styles.highlightDot} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className={styles.ctaRow}>
              <a
                href="#precos"
                className={styles.ctaPrimary}
              >
                Ver preços
                <ArrowRight className="size-4 opacity-80" aria-hidden />
              </a>
              <Link href="/curso" className={styles.ctaSecondary}>
                Ver programa completo
              </Link>
            </div>
          </div>

          <div className={styles.visual}>
            <div className={styles.logoFrame}>
              <ClaudePixelLogo size={320} cellSize={3} morph morphCycle={24} />
            </div>
            <p className={styles.logoCaption}>
              <span className={styles.logoCaptionA}>
                Claude · Cowork para advogados
              </span>
              <span className={styles.logoCaptionB} aria-hidden>
                Balança · IA na bancada
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
