"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapSignInError } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { fireSubtleConfetti } from "@/lib/confetti";
import {
  isDemoMode,
  isSignupEnabled,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

type SignupFormProps = {
  initialToken: string;
};

export function SignupForm({ initialToken }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));

  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Timer do redirect pós-parabéns; limpo no unmount pra não navegar depois.
  const redirectTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  const goToApp = useCallback(() => {
    if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    router.push(next);
    router.refresh();
  }, [next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled() || !isSignupEnabled()) return;
    setStatus("loading");
    setMessage(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, token: token.trim() }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (!res.ok || !data.ok) {
      setStatus("error");
      setMessage(data.error ?? "Não foi possível concluir o cadastro.");
      return;
    }

    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signErr) {
      setStatus("error");
      setMessage(
        `Conta criada, mas o login automático falhou: ${mapSignInError(signErr)}`,
      );
      return;
    }

    // Conta criada: celebra (confete laranja + preto) e segue pra área de membros.
    setStatus("success");
    fireSubtleConfetti();
    redirectTimer.current = window.setTimeout(goToApp, 2800);
  }

  if (status === "success") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[var(--background)]/95 px-6 text-center backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="ca-celebrate flex flex-col items-center gap-5">
          <div className="ca-badge-pop flex size-20 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] ring-1 ring-[var(--accent)]/30">
            <PartyPopper className="size-9" aria-hidden />
          </div>

          <div className="ca-rise" style={{ animationDelay: "0.14s" }}>
            <h2 className="font-serif text-3xl tracking-tight text-[var(--foreground)]">
              Parabéns! Sua conta está pronta
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              Bem-vindo à Claude Academy. Estamos te levando para a área de
              membros…
            </p>
          </div>

          <button
            type="button"
            onClick={goToApp}
            className="ca-rise inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#0a0a0a] transition hover:bg-[var(--accent-hover)]"
            style={{ animationDelay: "0.24s" }}
          >
            Entrar agora
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (!isSupabaseEnabled()) {
    if (isDemoMode()) {
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
          <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
            Em breve
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Cadastro com convite em breve. Em localhost, o conteúdo já está em{" "}
            <Link
              href="/area-de-membros"
              className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
            >
              modo demo
            </Link>
            .
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
        <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
          Cadastro indisponível
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          O cadastro exige Supabase configurado. Modo demo só existe em localhost.
        </p>
      </div>
    );
  }

  if (!isSignupEnabled()) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
        <p className="text-sm text-[var(--muted)]">
          Cadastro fechado.{" "}
          <Link
            href="/login"
            className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
          >
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        Token de convite
        <input
          type="text"
          required
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className={inputClass}
          placeholder="Cole o código recebido"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        E-mail
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
      <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
        Senha (mín. 8 caracteres)
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
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[#0a0a0a] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "loading" ? "Cadastrando…" : "Cadastrar"}
      </button>
      {message && (
        <p
          className={
            status === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-[var(--muted)]"
          }
        >
          {message}
        </p>
      )}
      <p className="text-center text-sm text-[var(--muted)]">
        Já tem conta?{" "}
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
