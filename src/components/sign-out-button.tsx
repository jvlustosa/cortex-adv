"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!isSupabaseEnabled()) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]"
    >
      Sair
    </button>
  );
}
