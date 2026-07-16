"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapPasswordResetRequestError } from "@/lib/auth/errors";
import { passwordResetRedirectUrl } from "@/lib/auth/password-reset";
import { isSupabaseConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled()) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setStatus("error");
      setMessage("Informe o e-mail cadastrado no convite.");
      return;
    }

    // Sem credenciais reais o fetch ao Supabase quebra no DNS/placeholder e cai
    // no catch como "Falha de conexão". Falha cedo com aviso honesto.
    if (!isSupabaseConfigured()) {
      setStatus("error");
      setMessage(
        "Recuperação indisponível: serviço de autenticação não configurado.",
      );
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: passwordResetRedirectUrl(),
      });

      if (error) {
        setStatus("error");
        setMessage(mapPasswordResetRequestError(error));
        return;
      }

      setStatus("sent");
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá um link para definir uma nova senha. Confira também o spam.",
      );
    } catch {
      setStatus("error");
      setMessage("Falha de conexão. Verifique a internet e tente novamente.");
    }
  }

  if (!isSupabaseEnabled()) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Recuperação de senha indisponível neste ambiente.
      </p>
    );
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="leading-relaxed text-[var(--foreground)]">{message}</p>
        <Link
          href="/login"
          className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        E-mail cadastrado
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="voce@escritorio.com.br"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Enviando…
          </>
        ) : (
          "Enviar link de recuperação"
        )}
      </button>
      {message && status === "error" ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {message}
        </p>
      ) : null}
      <p className="text-center text-sm text-[var(--muted)]">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
