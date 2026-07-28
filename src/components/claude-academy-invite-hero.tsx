"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { OpenGroupLink } from "@/components/open-group-link";
import { fireSubtleConfetti } from "@/lib/confetti";
import { COURSE_MENTOR } from "@/lib/site";
import {
  BRAZIL_DDI,
  DDI_OPTIONS,
  formatPhoneForDdi,
  submitWaitlist,
} from "@/lib/waitlist/form";
import { markLead, useIsLead } from "@/lib/waitlist/lead";
import styles from "./claude-academy-invite-hero.module.css";

type ClaudeAcademyWaitlistProps = {
  /** Só o formulário, sem título duplicado (uso no hero). */
  compact?: boolean;
};

function obrigadoPath(search: string): string {
  return search ? `/obrigado?${search}` : "/obrigado";
}

export function ClaudeAcademyWaitlist({
  compact = false,
}: ClaudeAcademyWaitlistProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ddi, setDdi] = useState(BRAZIL_DDI);
  const [isClient, setIsClient] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Lead que volta pode reabrir o form (outra pessoa, outro e-mail).
  const [showFormAgain, setShowFormAgain] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);
  const alreadyLead = useIsLead();

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  const isBrazil = ddi === BRAZIL_DDI;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await submitWaitlist(
      { nome, email, whatsapp, ddi, isClient },
      {
        page: pathname,
        urlParams: queryString ? `?${queryString}` : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        honeypot,
      },
    );

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    markLead();

    // Confete sutil antes de seguir pro /obrigado.
    // Sem animação (reduced-motion / sem canvas), redireciona na hora.
    const next = obrigadoPath(queryString);
    if (fireSubtleConfetti()) {
      redirectTimer.current = window.setTimeout(() => router.push(next), 650);
    } else {
      router.push(next);
    }
  }

  return (
    <section
      className={compact ? styles.compact : styles.section}
      aria-label={compact ? "Lista de espera" : undefined}
      aria-labelledby={compact ? undefined : "waitlist-heading"}
    >
      <div className={styles.content}>
        {alreadyLead && !showFormAgain ? (
          <div
            className={`${styles.success} ${styles.successVisible}`}
            role="status"
          >
            <CheckCircle2
              className="mx-auto mb-2 size-7 text-[var(--accent)]"
              aria-hidden
            />
            <strong>Você já está na lista</strong>
            Avisamos no WhatsApp assim que as inscrições abrirem.
            <div className={styles.communityCta}>
              <p className={styles.communityQ}>Enquanto isso</p>
              <p className={styles.communitySub}>
                Entre no grupo aberto e acompanhe as novidades do Claude para
                advogados.
              </p>
              <OpenGroupLink className={styles.communityBtn}>
                <WhatsAppIcon className="size-[18px]" />
                Entrar na comunidade gratuita
              </OpenGroupLink>
            </div>
            <button
              type="button"
              className={styles.reenroll}
              onClick={() => setShowFormAgain(true)}
            >
              Inscrever outra pessoa ou outro e-mail
            </button>
          </div>
        ) : (
          <>
        {!compact && (
          <>
            <p className={styles.eyebrow}>Primeira turma · Lista de espera</p>
            <h2 id="waitlist-heading" className={styles.heading}>
              Garanta sua vaga na primeira turma
            </h2>
            <p className={styles.subtitle}>
              Mentoria com <strong>{COURSE_MENTOR.name}</strong>. Avisamos no
              WhatsApp assim que as inscrições abrirem.
            </p>
          </>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="website"
              className={styles.honeypot}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />

            <input
              type="text"
              name="nome"
              className={styles.input}
              placeholder="Seu nome"
              autoComplete="name"
              required
              value={nome}
              onChange={(event) => setNome(event.target.value)}
            />

            <input
              type="email"
              name="email"
              className={styles.input}
              placeholder="Seu melhor e-mail"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <div className={styles.phoneGroup}>
              <select
                id="ca-whatsapp-ddi"
                name="whatsapp_ddi"
                className={`${styles.input} ${styles.ddiSelect}`}
                aria-label="Código do país"
                value={ddi}
                onChange={(event) => {
                  setDdi(event.target.value);
                  setWhatsapp("");
                }}
              >
                {DDI_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="whatsapp"
                className={styles.input}
                placeholder={isBrazil ? "WhatsApp com DDD" : "Número de WhatsApp"}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={isBrazil ? 15 : 18}
                required
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(formatPhoneForDdi(ddi, event.target.value))
                }
              />
            </div>

            <label
              className={`${styles.checkboxRow} ${isClient ? styles.checkboxRowChecked : ""}`}
              htmlFor="ca-is-client"
            >
              <input
                type="checkbox"
                id="ca-is-client"
                name="is_client"
                className={styles.checkbox}
                checked={isClient}
                onChange={(event) => setIsClient(event.target.checked)}
              />
              <span>Já sou cliente do Chat Jurídico</span>
            </label>

            <p
              className={`${styles.error} ${error ? styles.errorVisible : ""}`}
              role="alert"
            >
              {error}
            </p>

            <button
              type="submit"
              className={styles.cta}
              disabled={loading}
              aria-busy={loading}
            >
              <span>{loading ? "Enviando…" : "Entrar na fila de espera"}</span>
              {loading ? (
                <Loader2 className="size-[18px] animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="size-[18px]" aria-hidden />
              )}
            </button>
          </form>

        {!compact && (
          <p className={styles.footerNote}>Sem spam. Avisamos só quando a turma abrir.</p>
        )}
          </>
        )}
      </div>
    </section>
  );
}
