"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapMagicLinkRequestError } from "@/lib/auth/errors";
import { SITE_URL } from "@/lib/site";
import { useToast } from "@/components/toast";
import {
  isDemoMode,
  isSupabaseConfigured,
  isSupabaseEnabled,
} from "@/lib/supabase/enabled";

const inputClass =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]";

export function LoginForm() {
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseEnabled()) return;

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      toast.error("Informe seu e-mail.");
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
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          // Só contas já criadas (convite/admin) recebem link — sem auto-cadastro.
          shouldCreateUser: false,
          emailRedirectTo: `${SITE_URL}/auth/confirm`,
        },
      });

      if (error) {
        const mapped = mapMagicLinkRequestError(error);
        if (mapped) {
          setStatus("idle");
          toast.error(mapped);
          return;
        }
        // Conta inexistente / signups off: cai no estado neutro de "enviado"
        // pra não revelar quais e-mails têm conta (anti-enumeração).
      }

      setStatus("sent");
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

  if (status === "sent") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-sm">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-4 py-5">
          <p className="font-serif text-xl tracking-tight text-[var(--foreground)]">
            Confira seu e-mail
          </p>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">
            Se <span className="text-[var(--foreground)]">{email}</span> tiver
            conta, enviamos um link de acesso. Abra no mesmo dispositivo e confira
            também o spam.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-center text-sm text-[var(--accent)] underline underline-offset-4 hover:opacity-90"
        >
          Usar outro e-mail
        </button>
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
          "Receber link de acesso"
        )}
      </button>
      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
        Entre só com o e-mail. Enviamos um link de acesso, sem senha.
      </p>
    </form>
  );
}
