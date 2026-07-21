import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClaudePixelLogo } from "@/components/claude-pixel-logo";
import { COURSE } from "@/data/course-content";
import { CURSO_NIVEIS, totalAulas } from "@/data/curso-roteiro";
import { COURSE_MENTOR } from "@/lib/site";
import styles from "./course-hero.module.css";

const HIGHLIGHTS = [
  "Trilha completa: do primeiro prompt à automação do escritório",
  "Grupo aberto grátis no WhatsApp: conheça antes de comprar",
  "Comunidade VIP exclusiva de alunos: suporte às aulas na matrícula",
] as const;

// Legendas que rodam embaixo do logo: identidade + benefícios com gatilhos
// sutis de diferenciação (exclusividade, domínio, escassez). Cada uma ocupa
// uma fatia igual do ciclo.
const CAPTION_SLICE_SECONDS = 5;
const LOGO_CAPTIONS = [
  "Claude · Cowork para advogados",
  "Turma pequena, mentoria direta",
  "Do prompt à peça pronta",
  "Poucos usam o Claude assim",
] as const;

export function CourseHero() {
  // Contagem do badge vem do roteiro completo (curso-roteiro.ts), mesma fonte
  // da página /curso. COURSE (course-content.ts) é só o conteúdo operacional do
  // player e cobre parte da trilha, então subnotifica o tamanho real do curso.
  // Bônus conta como aula, mas não como módulo.
  const moduleCount = CURSO_NIVEIS.filter((n) => n.level !== "bonus").length;
  const lessonCount = totalAulas();

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
              o Claude Cowork na bancada: peças, automação e uso ético, sem
              programar. Inclui Comunidade VIP exclusiva de alunos e mentoria
              com{" "}
              <strong className="text-[var(--foreground)]">
                {COURSE_MENTOR.name}
              </strong>
              . O grupo aberto no WhatsApp continua gratuito para quem quiser
              conhecer primeiro.
            </p>

            <div className={styles.stats}>
              <span className={styles.stat}>
                <strong>{moduleCount}</strong> módulos
              </span>
              <span className={styles.stat}>
                <strong>{lessonCount}</strong> aulas
              </span>
              <span className={styles.stat}>
                <strong>Grupo</strong> aberto
              </span>
              <span className={styles.stat}>
                <strong>Grupo</strong> exclusivo
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
              {LOGO_CAPTIONS.map((caption, index) => (
                <span
                  key={caption}
                  className={styles.logoCaptionItem}
                  aria-hidden={index > 0}
                  style={{
                    animationDuration: `${LOGO_CAPTIONS.length * CAPTION_SLICE_SECONDS}s`,
                    animationDelay: `${index * CAPTION_SLICE_SECONDS}s`,
                  }}
                >
                  {caption}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
