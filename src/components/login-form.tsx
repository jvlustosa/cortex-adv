"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mapSignInError } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { useToast } from "@/components/toast";
import {
  isDemoMode,
  isSignupEnabled,
  isSupabaseConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled()) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      toast.error("Informe seu e-mail.");
      return;
    }

    if (!password) {
      toast.error("Informe sua senha.");
      return;
    }

    // Sem credenciais reais o fetch ao Supabase quebra no DNS e parece "erro de
    // internet". Falha cedo com um aviso honesto em vez de disparar a requisição.
    if (!isSupabaseConfigured()) {
      toast.error(
        "Login indisponível: serviço de autenticação não configurado.",
      );
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (error) {
        setStatus("idle");
        toast.error(mapSignInError(error));
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setStatus("idle");
      toast.error("Falha de conexão. Verifique a internet e tente novamente.");
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
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="voce@escritorio.com.br"
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
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "loading" ? "Entrando…" : "Entrar"}
      </button>
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
