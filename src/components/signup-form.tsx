"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSignupEnabled, isSupabaseEnabled } from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

type SignupFormProps = {
  initialToken: string;
};

export function SignupForm({ initialToken }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/membros";

  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

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
        "Conta criada, mas o login automático falhou. Tente Entrar com e-mail e senha.",
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (!isSupabaseEnabled()) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5 text-center">
        <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
          Em breve
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Cadastro com convite em breve. O conteúdo já está disponível em{" "}
          <Link
            href="/membros"
            className="text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
          >
            modo demo
          </Link>
          .
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
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
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
