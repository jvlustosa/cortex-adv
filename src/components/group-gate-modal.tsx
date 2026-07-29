"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, CheckCircle2, Loader2, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { fireSubtleConfetti } from "@/lib/confetti";
import { COMMUNITY, OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";
import {
  BRAZIL_DDI,
  DDI_OPTIONS,
  formatPhoneForDdi,
  submitWaitlist,
} from "@/lib/waitlist/form";
import { markLead } from "@/lib/waitlist/lead";
import styles from "./group-gate-modal.module.css";

type GroupGateModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Gate do grupo aberto: o link do WhatsApp só sai depois dos dados, que vão
 * pela mesma rota da lista de espera (/api/waitlist → n8n). Espelha o popup do
 * chatjuridico.com.br, inclusive na chave de lead.
 */
export function GroupGateModal({ open, onClose }: GroupGateModalProps) {
  const titleId = useId();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ddi, setDdi] = useState(BRAZIL_DDI);
  const [isClient, setIsClient] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Depois do envio o próximo passo é o botão do grupo — o foco vai pra lá.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      (done ? groupRef.current : nomeRef.current)?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open, done]);

  const isBrazil = ddi === BRAZIL_DDI;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await submitWaitlist(
      { nome, email, whatsapp, ddi, isClient },
      {
        page: window.location.pathname,
        urlParams: window.location.search,
        referrer: document.referrer,
        honeypot,
      },
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    markLead();
    setDone(true);
    fireSubtleConfetti();
  }

  // `open` só vira true a partir de um clique — no SSR isto é sempre null, então
  // o portal nunca corre sem document nem gera mismatch de hidratação.
  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="size-4" aria-hidden />
        </button>

        {done ? (
          <div className={styles.success} role="status">
            <CheckCircle2 className={styles.successIcon} aria-hidden />
            <h2 id={titleId} className={styles.title}>
              Pronto. Agora é só entrar.
            </h2>
            <p className={styles.desc}>
              Você também passa a receber os avisos do Claude Academy quando
              abrir turma nova.
            </p>
            <a
              ref={groupRef}
              href={OPEN_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.groupCta}
            >
              <WhatsAppIcon className="size-[18px]" />
              Entrar no grupo do WhatsApp
            </a>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p className={styles.eyebrow}>
              {COMMUNITY.open.badge} · {COMMUNITY.open.name}
            </p>
            <h2 id={titleId} className={styles.title}>
              Entrar no grupo aberto
            </h2>
            <p className={styles.desc}>
              Deixe seus dados e o link do grupo aparece aqui. É o grupo
              gratuito de advogados que usam Claude no dia a dia.
            </p>

            <ul className={styles.perks}>
              {COMMUNITY.open.perks.map((perk) => (
                <li key={perk} className={styles.perk}>
                  <Check className={styles.perkIcon} aria-hidden />
                  {perk}
                </li>
              ))}
            </ul>

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
                ref={nomeRef}
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
                  placeholder={
                    isBrazil ? "WhatsApp com DDD" : "Número de WhatsApp"
                  }
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

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="is_client"
                  className={styles.checkbox}
                  checked={isClient}
                  onChange={(event) => setIsClient(event.target.checked)}
                />
                <span>Já sou cliente do Chat Jurídico</span>
              </label>

              {/* Cadastro falhou não pode custar a entrada no grupo: o link é
                  público (QR do /grupo). Liberamos direto em vez de perder a
                  pessoa por causa de erro nosso. */}
              {error ? (
                <div className={styles.errorBox} role="alert">
                  <p className={styles.error}>{error}</p>
                  <a
                    href={OPEN_WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.errorFallback}
                  >
                    <WhatsAppIcon className="size-[16px]" />
                    Clique aqui para acessar o link do grupo
                  </a>
                </div>
              ) : null}

              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
                aria-busy={loading}
              >
                <span>{loading ? "Enviando…" : "Liberar o link do grupo"}</span>
                {loading ? (
                  <Loader2 className="size-[18px] animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-[18px]" aria-hidden />
                )}
              </button>

              <p className={styles.fine}>
                Sem spam. Você sai do grupo quando quiser.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
