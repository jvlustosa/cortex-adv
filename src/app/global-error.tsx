"use client";

import { ErrorState } from "@/components/error-state";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ErrorState error={error} digest={error.digest} onRetry={reset} />
      </body>
    </html>
  );
}
