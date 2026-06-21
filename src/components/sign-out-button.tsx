"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/enabled";

export function SignOutButton({
  className,
  onSignedOut,
  showIcon = false,
}: {
  className?: string;
  onSignedOut?: () => void;
  showIcon?: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignedOut?.();
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
      className={
        className ??
        "rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]"
      }
    >
      {showIcon ? <LogOut className="size-4 shrink-0" aria-hidden /> : null}
      Sair
    </button>
  );
}
