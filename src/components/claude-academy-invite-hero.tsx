"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { readApiErrorMessage } from "@/lib/errors/format";
import { fireSubtleConfetti } from "@/lib/confetti";
import {
  COURSE_MENTOR,
  OPEN_WHATSAPP_GROUP_URL,
  WAITLIST_API_URL,
} from "@/lib/site";
import styles from "./claude-academy-invite-hero.module.css";

const LEAD_KEY = "cj_claude_academy_lead";

// Leitura SSR-safe do flag de lead (localStorage) sem setState-in-effect.
const subscribeLead = () => () => {};
const getLeadSnapshot = () => {
  try {
    return localStorage.getItem(LEAD_KEY) === "1";
  } catch {
    return false;
  }
};
const getLeadServerSnapshot = () => false;

const DDI_OPTIONS = [
  { value: "+55", label: "🇧🇷 +55", min: 10, max: 11 },
  { value: "+1", label: "🇺🇸 +1", min: 10, max: 10 },
  { value: "+351", label: "🇵🇹 +351", min: 9, max: 9 },
  { value: "+54", label: "🇦🇷 +54", min: 10, max: 11 },
  { value: "+34", label: "🇪🇸 +34", min: 9, max: 9 },
  { value: "+39", label: "🇮🇹 +39", min: 9, max: 11 },
  { value: "+44", label: "🇬🇧 +44", min: 10, max: 10 },
  { value: "+33", label: "🇫🇷 +33", min: 9, max: 9 },
  { value: "+49", label: "🇩🇪 +49", min: 10, max: 11 },
  { value: "+56", label: "🇨🇱 +56", min: 9, max: 9 },
  { value: "+57", label: "🇨🇴 +57", min: 10, max: 10 },
  { value: "+52", label: "🇲🇽 +52", min: 10, max: 10 },
  { value: "+595", label: "🇵🇾 +595", min: 9, max: 9 },
  { value: "+598", label: "🇺🇾 +598", min: 8, max: 9 },
] as const;

type ClaudeAcademyWaitlistProps = {
  /** Só o formulário, sem título duplicado (uso no hero). */
  compact?: boolean;
};

function formatBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return "";
}

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
  const [ddi, setDdi] = useState("+55");
  const [isClient, setIsClient] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);
  const alreadyLead = useSyncExternalStore(
    subscribeLead,
    getLeadSnapshot,
    getLeadServerSnapshot,
  );

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  const isBrazil = ddi === "+55";
  const selectedDdi = DDI_OPTIONS.find((option) => option.value === ddi) ?? DDI_OPTIONS[0];

  function handleWhatsappChange(value: string) {
    if (isBrazil) {
      setWhatsapp(formatBrazilPhone(value));
      return;
    }
    const maxDigits = 15;
    setWhatsapp(value.replace(/\D/g, "").slice(0, maxDigits));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nomeTrim = nome.trim();
    const emailTrim = email.trim();
    const whatsappTrim = whatsapp.trim();
    const digits = whatsappTrim.replace(/\D/g, "");

    if (nomeTrim.length < 2) {
      setError("Informe seu nome.");
      return;
    }
    if (emailTrim.length < 5 || !emailTrim.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (digits.length < selectedDdi.min || digits.length > selectedDdi.max) {
      setError(
        isBrazil
          ? "Informe o WhatsApp com DDD."
          : "Informe o número de WhatsApp completo.",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(WAITLIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeTrim,
          email: emailTrim,
          whatsapp: `${ddi}${digits}`,
          whatsapp_ddi: ddi,
          whatsapp_local: whatsappTrim,
          is_client: isClient,
          page: pathname,
          url_params: queryString ? `?${queryString}` : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          website: honeypot,
        }),
      });

      if (!res.ok) {
        setError(
          await readApiErrorMessage(res, "Não foi possível enviar. Tente de novo em instantes."),
        );
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(LEAD_KEY, "1");
      } catch {
        /* ignore */
      }

      // Confete sutil antes de seguir pro /obrigado.
      // Sem animação (reduced-motion / sem canvas), redireciona na hora.
      const next = obrigadoPath(queryString);
      if (fireSubtleConfetti()) {
        redirectTimer.current = window.setTimeout(() => router.push(next), 650);
      } else {
        router.push(next);
      }
    } catch {
      setError("Erro de conexão. Verifique a internet e tente novamente.");
      setLoading(false);
    }
  }

  return (
    <section
      className={compact ? styles.compact : styles.section}
      aria-label={compact ? "Lista de espera" : undefined}
      aria-labelledby={compact ? undefined : "waitlist-heading"}
    >
      <div className={styles.content}>
        {alreadyLead ? (
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
              <a
                className={styles.communityBtn}
                href={OPEN_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-[18px]" />
                Entrar na comunidade gratuita
              </a>
            </div>
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
                onChange={(event) => handleWhatsappChange(event.target.value)}
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
