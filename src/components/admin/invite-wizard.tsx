"use client";

import { useState } from "react";
import styles from "./admin-dashboard.module.css";

type Props = {
  /** Recarrega a lista de convites emitidos após uma criação bem-sucedida. */
  onCreated: () => void | Promise<void>;
};

type WizardStep = 1 | 2 | 3;

type InviteFormState = {
  recipientName: string;
  recipientEmail: string;
  recipientTitle: string;
  label: string;
  maxUses: string;
  expiresAt: string;
};

type InviteResult = {
  signupUrl: string;
  recipientEmail: string | null;
  emailSent: boolean;
  emailError?: string;
};

const EMPTY_FORM: InviteFormState = {
  recipientName: "",
  recipientEmail: "",
  recipientTitle: "",
  label: "",
  maxUses: "1",
  expiresAt: "",
};

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: "Destinatário" },
  { id: 2, label: "Configuração" },
  { id: 3, label: "Revisar" },
];

const LABEL_SUGGESTIONS = [
  "1ª turma",
  "2ª turma",
  "3ª turma",
  "Convite premium",
  "Demo local",
  "VIP",
];

const TITLE_LABELS: Record<string, string> = {
  dr: "Dr.",
  dra: "Dra.",
};

const EXPIRY_PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Hoje + N dias no formato yyyy-mm-dd exigido pelo <input type="date">. */
function addDaysISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatExpiry(value: string): string {
  if (!value) return "Sem validade";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem validade";
  return date.toLocaleDateString("pt-BR");
}

export function InviteWizard({ onCreated }: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<InviteFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  const email = form.recipientEmail.trim();
  const hasEmail = email.length > 0;
  const emailValid = !hasEmail || isValidEmail(email);
  const willSend = hasEmail && emailValid;

  function update<K extends keyof InviteFormState>(
    key: K,
    value: InviteFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setError(null);
    if (step === 1 && hasEmail && !emailValid) {
      setError("E-mail do convidado inválido.");
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  }

  function goBack() {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  }

  function reset() {
    setForm(EMPTY_FORM);
    setResult(null);
    setError(null);
    setStep(1);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  async function submit() {
    setCreating(true);
    setError(null);
    try {
      const maxUses = Number.parseInt(form.maxUses, 10);
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim() || undefined,
          maxUses: Number.isFinite(maxUses) ? maxUses : 1,
          expiresAt: form.expiresAt.trim() || null,
          recipientName: form.recipientName.trim() || null,
          recipientEmail: email || null,
          recipientTitle: form.recipientTitle || null,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        invite?: { signupUrl: string; recipientEmail: string | null };
        email?: { sent: boolean; error?: string };
      };

      if (!res.ok || !data.invite) {
        throw new Error(data.error ?? "Erro ao criar convite.");
      }

      setResult({
        signupUrl: data.invite.signupUrl,
        recipientEmail: data.invite.recipientEmail,
        emailSent: data.email?.sent ?? false,
        emailError: data.email?.error,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar convite.");
    } finally {
      setCreating(false);
    }
  }

  if (result) {
    return (
      <div className={styles.inviteForm}>
        <div className={styles.inviteCreated}>
          <p className={styles.feedbackMeta}>Link de cadastro gerado:</p>
          <code className={styles.inviteUrl}>{result.signupUrl}</code>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => void copyText(result.signupUrl)}
            >
              Copiar link
            </button>
            <button type="button" className={styles.editBtn} onClick={reset}>
              Novo convite
            </button>
          </div>

          {result.recipientEmail && result.emailSent ? (
            <p className={`${styles.emailNote} ${styles.emailNoteOk}`}>
              ✓ Convite enviado para {result.recipientEmail}.
            </p>
          ) : null}
          {result.recipientEmail && !result.emailSent ? (
            <p className={`${styles.emailNote} ${styles.emailNoteWarn}`}>
              ⚠ Convite criado, mas o e-mail não saiu
              {result.emailError ? `: ${result.emailError}` : "."} Você pode
              copiar o link acima ou reenviar pela lista abaixo.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.inviteForm}>
      <ol className={styles.wizardSteps} aria-label="Etapas do convite">
        {STEPS.map((s) => (
          <li
            key={s.id}
            className={`${styles.wizardStep} ${
              s.id === step
                ? styles.wizardStepActive
                : s.id < step
                  ? styles.wizardStepDone
                  : ""
            }`}
          >
            <span className={styles.wizardStepNum}>{s.id}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <>
          <label className={styles.field}>
            <span className={styles.label}>Nome do convidado (opcional)</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="off"
              placeholder="Ex.: Fulana de Tal"
              value={form.recipientName}
              onChange={(e) => update("recipientName", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>E-mail do convidado (opcional)</span>
            <input
              className={styles.input}
              type="email"
              autoComplete="off"
              placeholder="convidado@escritorio.com.br"
              value={form.recipientEmail}
              onChange={(e) => update("recipientEmail", e.target.value)}
            />
            <span className={styles.fieldHint}>
              Com e-mail, o convite é enviado automático ao gerar.
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Título (opcional)</span>
            <select
              className={styles.input}
              value={form.recipientTitle}
              onChange={(e) => update("recipientTitle", e.target.value)}
            >
              <option value="">Sem título</option>
              <option value="dra">Dra.</option>
              <option value="dr">Dr.</option>
            </select>
          </label>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <label className={styles.field}>
            <span className={styles.label}>Rótulo (opcional)</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="off"
              list="invite-label-suggestions"
              placeholder="Ex.: 1ª turma, VIP, Demo local"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
            />
            <datalist id="invite-label-suggestions">
              {LABEL_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Usos permitidos</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => update("maxUses", e.target.value)}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Expira em (opcional)</span>
            <input
              className={styles.input}
              type="date"
              aria-label="Data de expiração do convite"
              value={form.expiresAt}
              onChange={(e) => update("expiresAt", e.target.value)}
            />
            <div className={styles.chipRow}>
              {EXPIRY_PRESETS.map((preset) => {
                const iso = addDaysISO(preset.days);
                const active = form.expiresAt === iso;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => update("expiresAt", active ? "" : iso)}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                className={`${styles.chip} ${
                  form.expiresAt === "" ? styles.chipActive : ""
                }`}
                onClick={() => update("expiresAt", "")}
              >
                Sem validade
              </button>
            </div>
            <span className={styles.fieldHint}>
              {form.expiresAt
                ? `Expira em ${formatExpiry(form.expiresAt)}.`
                : "Convite sem data de expiração."}
            </span>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <div className={styles.wizardReview}>
          <dl className={styles.reviewList}>
            <div className={styles.reviewRow}>
              <dt className={styles.reviewKey}>Convidado</dt>
              <dd className={styles.reviewVal}>
                {[TITLE_LABELS[form.recipientTitle], form.recipientName.trim()]
                  .filter(Boolean)
                  .join(" ") || "Sem nome"}
              </dd>
            </div>
            <div className={styles.reviewRow}>
              <dt className={styles.reviewKey}>E-mail</dt>
              <dd className={styles.reviewVal}>{email || "Sem e-mail"}</dd>
            </div>
            <div className={styles.reviewRow}>
              <dt className={styles.reviewKey}>Rótulo</dt>
              <dd className={styles.reviewVal}>
                {form.label.trim() || "Sem rótulo"}
              </dd>
            </div>
            <div className={styles.reviewRow}>
              <dt className={styles.reviewKey}>Usos / validade</dt>
              <dd className={styles.reviewVal}>
                {form.maxUses || "1"} uso(s) · {formatExpiry(form.expiresAt)}
              </dd>
            </div>
          </dl>

          <p
            className={`${styles.emailNote} ${
              willSend ? styles.emailNoteOk : ""
            }`}
          >
            {willSend
              ? `✉ Ao gerar, o convite será enviado para ${email}.`
              : "Sem e-mail: o convite só gera o link para você copiar."}
          </p>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.wizardNav}>
        {step > 1 ? (
          <button
            type="button"
            className={styles.btnGhost}
            onClick={goBack}
            disabled={creating}
          >
            Voltar
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button type="button" className={styles.btnPrimary} onClick={goNext}>
            Continuar
          </button>
        ) : (
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={creating}
            onClick={() => void submit()}
          >
            {creating
              ? "Gerando…"
              : willSend
                ? "Gerar e enviar"
                : "Gerar convite"}
          </button>
        )}
      </div>
    </div>
  );
}
