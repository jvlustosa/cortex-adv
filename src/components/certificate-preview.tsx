"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Award, ShieldCheck, Sparkles } from "lucide-react";
import { CLAUDE_ACADEMY_LOGO } from "@/components/claude-academy-brand";
import { COURSE_MENTOR } from "@/lib/site";
import { DEMO_CERTIFICATE_CODE } from "@/lib/certificates/constants";
import { certificateVerifyPath } from "@/lib/certificates/normalize";
import styles from "./certificate-preview.module.css";

function ClaudeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
  );
}

export function CertificatePreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    const holo = holoRef.current;
    if (!el || !holo) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setTilt({
      rx: (y - 0.5) * -10,
      ry: (x - 0.5) * 12,
    });

    holo.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
  }, []);

  const handleLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    const holo = holoRef.current;
    if (holo) holo.style.backgroundPosition = "";
  }, []);

  return (
    <section
      className={`${styles.section} border-t border-[var(--border)] px-6 py-16 md:py-20`}
      aria-labelledby="certificado-heading"
    >
      <div className={styles.sectionGlow} aria-hidden />

      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Certificação
          </p>
          <h2
            id="certificado-heading"
            className="mt-4 font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl"
          >
            Certificado ao concluir o curso
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            Terminou Claude para Advogados? Você recebe um certificado digital
            com selo holográfico, assinatura do Chat Jurídico e código de
            verificação online, prova de que você domina o Claude na bancada.
          </p>
        </div>

        <div className={styles.stage}>
          <div
            ref={cardRef}
            className={styles.cardWrap}
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            }}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
          >
            <article
              className={styles.card}
              aria-label="Prévia do certificado Claude Academy, exemplo ilustrativo"
            >
              <div className={styles.watermark} aria-hidden />
              <div className={styles.frame} aria-hidden />
              <div className={styles.frameCornerTl} aria-hidden />
              <div className={styles.frameCornerTr} aria-hidden />
              <div className={styles.frameCornerBl} aria-hidden />
              <div className={styles.frameCornerBr} aria-hidden />
              <div ref={holoRef} className={styles.holoLayer} aria-hidden />
              <div className={styles.holoSheen} aria-hidden />

              <div className={styles.cardInner}>
                <div>
                  <span className={styles.badge}>
                    <Sparkles className="size-3" aria-hidden />
                    Preview · 2026
                  </span>

                  <div className={`${styles.logoRow} mt-4`}>
                    <Image
                      src={CLAUDE_ACADEMY_LOGO}
                      alt="Claude Academy"
                      width={48}
                      height={48}
                      className={styles.logoAcademy}
                    />
                  </div>

                  <p className={styles.certSubtitle}>Certificado de conclusão</p>
                  <h3 className={styles.certTitle}>Claude Academy</h3>
                  <p className={styles.certSubtitle}>
                    IA generativa para advogados
                  </p>
                </div>

                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Certificamos que
                  </p>
                  <p className={styles.recipient}>Dra. Maria Silva</p>
                  <p className={`${styles.bodyText} mx-auto mt-2`}>
                    concluiu com aproveitamento o programa de formação em Claude
                    e automação jurídica, com carga horária de 12 horas.
                  </p>
                </div>

                <div className={styles.footerRow}>
                  <div className={styles.sigBlock}>
                    <div className={styles.sigLine} aria-hidden />
                    <p className={styles.sigName}>{COURSE_MENTOR.name}</p>
                    <p className={styles.sigRole}>{COURSE_MENTOR.role} · Chat Jurídico</p>
                  </div>

                  <div className={styles.seal} aria-hidden>
                    <ClaudeMark className={styles.sealIcon} />
                  </div>

                  <div className="text-right">
                    <Link
                      href={certificateVerifyPath(DEMO_CERTIFICATE_CODE)}
                      className={`${styles.meta} block transition hover:text-[var(--accent)]`}
                    >
                      ID · {DEMO_CERTIFICATE_CODE}
                    </Link>
                    <p className={styles.meta}>Jun 2026</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)]">
          Prévia ilustrativa: o certificado final incluirá seu nome, data de
          conclusão e{" "}
          <Link
            href="/validar/"
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
          >
            código de verificação
          </Link>
          .
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <Award className={`${styles.featureIcon} size-5`} aria-hidden />
            <p className={styles.featureTitle}>Selo holográfico</p>
            <p className={styles.featureDesc}>
              Acabamento premium em tons terracota do Claude, com brilho
              iridescente anti-falsificação.
            </p>
          </div>
          <div className={styles.feature}>
            <Sparkles className={`${styles.featureIcon} size-5`} aria-hidden />
            <p className={styles.featureTitle}>Marca dual</p>
            <p className={styles.featureDesc}>
              Logos Claude Academy e Chat Jurídico: credibilidade da formação e
              da plataforma.
            </p>
          </div>
          <div className={styles.feature}>
            <ShieldCheck className={`${styles.featureIcon} size-5`} aria-hidden />
            <p className={styles.featureTitle}>Verificação online</p>
            <p className={styles.featureDesc}>
              Código único em{" "}
              <Link
                href={certificateVerifyPath(DEMO_CERTIFICATE_CODE)}
                className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
              >
                claudeacademy.chatjuridico.com.br/validar
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
