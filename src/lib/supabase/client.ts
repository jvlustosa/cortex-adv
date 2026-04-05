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
  return createBrowserClient(url, key);
}
