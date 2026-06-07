"use client";

import { useSearchParams } from "next/navigation";
import { mapAuthCallbackQueryError } from "@/lib/auth/errors";

export function LoginStatusBanner() {
  const searchParams = useSearchParams();
  const error = mapAuthCallbackQueryError(searchParams.get("error"));

  if (!error) return null;

  return (
    <p
      className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
      role="alert"
    >
      {error}
    </p>
  );
}
