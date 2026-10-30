"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Download, Loader2, X } from "lucide-react";
import {
  FREE_MATERIALS,
  freeMaterialDownloadHref,
  type FreeMaterial,
} from "@/data/materiais";
import { fireSubtleConfetti } from "@/lib/confetti";
import {
  BRAZIL_DDI,
  DDI_OPTIONS,
  formatPhoneForDdi,
  submitWaitlist,
} from "@/lib/waitlist/form";
import { markLead } from "@/lib/waitlist/lead";
import styles from "./group-gate-modal.module.css";

type MaterialsGateModalProps = {
  /** Apostila que a pessoa clicou; null = modal fechado. */
  material: FreeMaterial | null;
  onClose: () => void;
};

/**
 * Gate das apostilas gratuitas: mesmos campos, rota (/api/waitlist) e chave de
 * lead do gate do grupo aberto. Um envio libera todas as apostilas da página.
 */
export function MaterialsGateModal({
  material,
  onClose,
}: MaterialsGateModalProps) {
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
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const open = material !== null;

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

  // Depois do envio o próximo passo é o download: o foco vai pra lá.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      (done ? downloadRef.current : nomeRef.current)?.focus();
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

  if (!material) return null;

  const downloadHref = freeMaterialDownloadHref(material.id);

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
              Pronto. Pode baixar.
            </h2>
            <p className={styles.desc}>
              As {FREE_MATERIALS.length} apostilas desta página ficaram
              liberadas pra você. É só clicar em cada uma.
            </p>
            <a ref={downloadRef} href={downloadHref} className={styles.submit}>
              <Download className="size-[18px]" aria-hidden />
              Baixar {material.title}
            </a>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Ver as outras apostilas
            </button>
          </div>
        ) : (
          <>
            <p className={styles.eyebrow}>
              Grátis · Apostila {material.id}
            </p>
            <h2 id={titleId} className={styles.title}>
              {material.title}
            </h2>
            <p className={styles.desc}>
              Deixe seus dados e o download sai na hora. Vale para as{" "}
              {FREE_MATERIALS.length} apostilas desta página.
            </p>

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

              {/* Mesma regra do grupo: falha nossa no cadastro não pode custar o
                  material. O erro aparece, mas o download segue liberado. */}
              {error ? (
                <div className={styles.errorBox} role="alert">
                  <p className={styles.error}>{error}</p>
                  <a href={downloadHref} className={styles.secondary}>
                    <Download className="mr-2 size-[16px]" aria-hidden />
                    Baixar mesmo assim
                  </a>
                </div>
              ) : null}

              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
                aria-busy={loading}
              >
                <span>{loading ? "Enviando…" : "Liberar download"}</span>
                {loading ? (
                  <Loader2 className="size-[18px] animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-[18px]" aria-hidden />
                )}
              </button>

              <p className={styles.fine}>
                Sem spam. Você recebe aviso de turma nova e de material novo.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
