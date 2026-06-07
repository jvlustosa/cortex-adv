"use client";

import { ErrorState } from "@/components/error-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return <ErrorState error={error} digest={error.digest} onRetry={reset} />;
}
