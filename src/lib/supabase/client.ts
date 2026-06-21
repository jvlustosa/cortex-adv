import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseEnabled } from "./enabled";

export function createClient() {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase desativado (NEXT_PUBLIC_SUPABASE_ENABLED).");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
  }
  // Placeholder = projeto não conectado. Falha aqui com mensagem clara em vez
  // de deixar o fetch quebrar no DNS e parecer falha de rede.
  if (url.includes("placeholder")) {
    throw new Error(
      "Supabase não configurado: NEXT_PUBLIC_SUPABASE_URL ainda é placeholder.",
    );
  }
  return createBrowserClient(url, key);
}
