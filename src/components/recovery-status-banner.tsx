"use client";

import { useSearchParams } from "next/navigation";
import { mapRecoveryPageError } from "@/lib/auth/errors";

export function RecoveryStatusBanner() {
  const searchParams = useSearchParams();
  const error = mapRecoveryPageError(searchParams.get("error"));

  if (!error) return null;

  return (
    <p
      className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
      role="alert"
    >
      {error}
    </p>
  );
}
