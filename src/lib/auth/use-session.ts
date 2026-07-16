"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

export type SessionUser = { email: string | null };

/**
 * Usuário da sessão do browser para dicas de UI na navegação pública
 * (header/menu). Lê o cookie via getSession (sem chamada de rede) e escuta
 * mudanças de auth. NÃO é fronteira de segurança — o gate real do curso é
 * server-side em requireCourseAccess.
 *
 * Retorna null enquanto resolve E quando deslogado (ou Supabase off/placeholder),
 * o que o consumidor renderiza como estado neutro ("Entrar") sem flash.
 */
export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;

    let active = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      // Supabase desligado/placeholder: mantém o estado neutro, sem quebrar a nav.
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session ? { email: data.session.user.email ?? null } : null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session ? { email: session.user.email ?? null } : null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
