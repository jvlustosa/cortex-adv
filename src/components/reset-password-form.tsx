"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapPasswordUpdateError } from "@/lib/auth/errors";
import { validateNewPassword } from "@/lib/auth/password-reset";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { isSupabaseConfigured, isSupabaseEnabled } from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

type ResetPasswordFormProps = {
  nextPath?: string;
};

export function ResetPasswordForm({ nextPath }: ResetPasswordFormProps) {
  const router = useRouter();
  const destination = safeRedirectPath(nextPath, "/area-de-membros");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled()) return;

    const validation = validateNewPassword(password);
    if (validation) {
      setStatus("error");
      setMessage(validation);
      return;
    }

    if (password !== confirm) {
      setStatus("error");
      setMessage("As senhas não coincidem.");
      return;
    }

    // Sem credenciais reais o fetch ao Supabase quebra e cai no catch como
    // "Falha de conexão". Falha cedo com aviso honesto.
    if (!isSupabaseConfigured()) {
      setStatus("error");
      setMessage(
        "Atualização de senha indisponível: serviço de autenticação não configurado.",
      );
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus("error");
        setMessage(mapPasswordUpdateError(error));
        return;
      }

      router.push(destination);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Falha de conexão. Verifique a internet e tente novamente.");
    }
  }

  if (!isSupabaseEnabled()) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Atualização de senha indisponível neste ambiente.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        Nova senha
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        Confirmar nova senha
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "loading" ? "Salvando…" : "Definir nova senha"}
      </button>
      {message ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {message}
        </p>
      ) : null}
      <p className="text-center text-sm text-[var(--muted)]">
        <Link
          href="/recuperar-senha"
          className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
        >
          Solicitar novo link
        </Link>
      </p>
    </form>
  );
}
