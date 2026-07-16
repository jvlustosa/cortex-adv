"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

/**
 * Sessão do browser para dicas de UI na navegação pública (header/menu).
 * Lê o cookie via getSession (sem chamada de rede) e escuta mudanças de auth.
 * NÃO é fronteira de segurança — o gate real do curso é server-side em
 * requireCourseAccess. Fica em null enquanto resolve (e nos casos de Supabase
 * desligado/placeholder), o que o consumidor renderiza como estado neutro
 * ("Entrar") sem flash.
 */
export function useIsAuthed(): boolean | null {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

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
      if (active) setIsAuthed(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsAuthed(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return isAuthed;
}
