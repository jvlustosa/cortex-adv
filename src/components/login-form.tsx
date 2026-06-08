"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mapSignInError } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  isDemoMode,
  isSignupEnabled,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Limpa o erro do formulário assim que o usuário corrige o campo.
  function clearFormError() {
    if (status === "error") {
      setStatus("idle");
      setMessage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled()) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setStatus("error");
      setMessage("Informe seu e-mail.");
      return;
    }

    if (!password) {
      setStatus("error");
      setMessage("Informe sua senha.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(mapSignInError(error));
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Falha de conexão. Verifique a internet e tente novamente.");
    }
  }

  if (!isSupabaseEnabled()) {
    if (isDemoMode()) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
          <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
            Em breve
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Login com convite em breve. Em localhost, o curso segue acessível em{" "}
            <Link
              href="/area-de-membros"
              className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
            >
              modo demo
            </Link>
            , sem conta.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
        <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
          Login indisponível
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          O acesso ao curso exige conta. Modo demo só funciona em localhost durante
          o desenvolvimento.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        E-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFormError();
          }}
          className={inputClass}
          placeholder="voce@escritorio.com.br"
          aria-invalid={status === "error" && message ? true : undefined}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        <span className="flex items-center justify-between gap-2">
          Senha
          <Link
            href="/recuperar-senha"
            className="text-xs text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
          >
            Esqueceu a senha?
          </Link>
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFormError();
          }}
          className={inputClass}
          aria-invalid={status === "error" && message ? true : undefined}
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "loading" ? "Entrando…" : "Entrar"}
      </button>
      {message ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {message}
        </p>
      ) : null}
      {isSignupEnabled() ? (
        <p className="text-center text-sm text-[var(--muted)]">
          Convite?{" "}
          <Link
            href="/signup"
            className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
          >
            Cadastrar
          </Link>
        </p>
      ) : null}
    </form>
  );
}
